const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const ContactRequest = require('../models/ContactRequest');
const { containsProfanity } = require('../utils/profanityFilter');
const { createNotification } = require('./notificationController');
const { db, admin } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');
const { deleteConversationArtifacts } = require('../utils/chatLifecycle');

const DEFAULT_CONVERSATION_LIMIT = 25;
const MAX_CONVERSATION_LIMIT = 50;
const DEFAULT_MESSAGE_LIMIT = 50;
const MAX_MESSAGE_LIMIT = 100;

const parsePagination = (query, defaultLimit, maxLimit) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const requestedLimit = parseInt(query.limit, 10) || defaultLimit;
    const limit = Math.min(Math.max(requestedLimit, 1), maxLimit);

    return {
        page,
        limit,
        skip: (page - 1) * limit
    };
};

const NOTIFICATION_MESSAGE_MAX_LENGTH = 80;
const CHAT_RETENTION_MS = 24 * 60 * 60 * 1000;

const getChatExpiryDate = () => new Date(Date.now() + CHAT_RETENTION_MS);

const buildConversationFilter = (userA, userB, postId = null) => ({
    participants: { $all: [userA, userB] },
    postId: postId || null
});

const getNotificationMessagePreview = (messageText) => {
    if (typeof messageText !== 'string') return '';
    const normalized = messageText.replace(/\s+/g, ' ').trim();
    return normalized.length > NOTIFICATION_MESSAGE_MAX_LENGTH
        ? `${normalized.slice(0, NOTIFICATION_MESSAGE_MAX_LENGTH)}…`
        : normalized;
};

// @desc    Get all conversations for a user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
    const { page, limit, skip } = parsePagination(
        req.query,
        DEFAULT_CONVERSATION_LIMIT,
        MAX_CONVERSATION_LIMIT
    );
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const conversationFilter = {
        participants: req.user.id,
        deletedBy: { $ne: req.user.id },
        isActive: { $ne: false }
    };

    const [conversations, total] = await Promise.all([
        Conversation.find(conversationFilter)
            .populate('participants', 'displayName avatar')
            .populate('lastMessage')
            .populate('postId', 'title images price description type location')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Conversation.countDocuments(conversationFilter)
    ]);

    const conversationIds = conversations.map((conv) => conv._id);
    const unreadCounts = conversationIds.length
        ? await Message.aggregate([
            {
                $match: {
                    conversationId: { $in: conversationIds },
                    sender: { $ne: userObjectId },
                    readBy: { $ne: userObjectId }
                }
            },
            {
                $group: {
                    _id: '$conversationId',
                    unreadCount: { $sum: 1 }
                }
            }
        ])
        : [];

    const unreadCountMap = new Map(
        unreadCounts.map((entry) => [entry._id.toString(), entry.unreadCount])
    );

    const conversationsWithUnread = conversations.map((conv) => ({
        ...conv,
        unreadCount: unreadCountMap.get(conv._id.toString()) || 0
    }));

    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));
    res.set('X-Total-Count', String(total));
    res.set('X-Has-More', String(skip + conversations.length < total));

    res.json(conversationsWithUnread);
});

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
    }
    
    if (!conversation.participants.map(p => p.toString()).includes(req.user.id)) {
        throw new ApiError(403, 'Not authorized to access this conversation');
    }

    const { page, limit, skip } = parsePagination(
        req.query,
        DEFAULT_MESSAGE_LIMIT,
        MAX_MESSAGE_LIMIT
    );
    const before = req.query.before ? new Date(req.query.before) : null;
    const messageFilter = { conversationId: req.params.conversationId };

    if (before && !isNaN(before.getTime())) {
        messageFilter.createdAt = { $lt: before };
    }

    const [messages, total] = await Promise.all([
        Message.find(messageFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Message.countDocuments(messageFilter)
    ]);

    const orderedMessages = messages.reverse();

    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));
    res.set('X-Total-Count', String(total));
    res.set('X-Has-More', String(skip + messages.length < total));

    res.json(orderedMessages);
});

// @desc    Get or Create Conversation with specific user
// @route   GET /api/chat/conversation/:userId
// @access  Private
exports.getOrCreateConversation = asyncHandler(async (req, res, next) => {
    const recipientId = req.params.userId;
    const postId = req.query.postId || null;

    // Check if conversation exists
    let conversation = await Conversation.findOne(buildConversationFilter(req.user.id, recipientId, postId))
        .populate('participants', ['displayName', 'avatar', 'isOnline'])
        .populate('lastMessage');

    // If conversation exists, check if it's still active
    if (conversation && conversation.isActive === false) {
        throw new ApiError(403, 'This conversation is no longer active because the post was deleted');
    }

    // If conversation doesn't exist, return conversation structure without creating
    if (!conversation) {
        // Verify user is connected before returning conversation details
        const connectionFilter = {
            $or: [
                { requester: req.user.id, recipient: recipientId, status: 'accepted' },
                { requester: recipientId, recipient: req.user.id, status: 'accepted' },
                { requester: req.user.id, recipient: recipientId, status: 'approved' },
                { requester: recipientId, recipient: req.user.id, status: 'approved' }
            ]
        };
        if (postId) {
            connectionFilter.post = postId;
        }
        const connection = await ContactRequest.findOne(connectionFilter);

        if (!connection) {
            throw new ApiError(403, 'You can only access conversations with connected users');
        }

        // Get recipient details
        const recipient = await User.findById(recipientId).select('displayName avatar isOnline');
        const currentUser = await User.findById(req.user.id).select('displayName avatar isOnline');

        return res.json({
            _id: null,
            participants: [currentUser, recipient],
            lastMessage: null,
            unreadCount: 0
        });
    }

    res.json(conversation);
});

// @desc    Get conversation by ID
// @route   GET /api/chat/conversations/:conversationId
// @access  Private
exports.getConversationById = asyncHandler(async (req, res, next) => {
    const conversation = await Conversation.findById(req.params.conversationId)
        .populate('participants', 'displayName avatar isOnline')
        .populate('lastMessage')
        .populate('postId', 'title images price description type location')
        .lean();

    if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
    }

    // Check if conversation is still active
    if (conversation.isActive === false) {
        throw new ApiError(403, 'This conversation is no longer active because the post was deleted');
    }

    if (!conversation.participants.some((participant) => participant._id.toString() === req.user.id)) {
        throw new ApiError(403, 'Not authorized to access this conversation');
    }

    const unreadCount = await Message.countDocuments({
        conversationId: conversation._id,
        sender: { $ne: req.user.id },
        readBy: { $ne: req.user.id }
    });

    res.json({
        ...conversation,
        unreadCount
    });
});

// @desc    Send a message
// @route   POST /api/chat/message
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
    if (!db) throw new ApiError(500, 'Firebase not initialized');
    const { recipientId, text, postId } = req.body;

    // Check if conversation exists
    let conversation = await Conversation.findOne(buildConversationFilter(req.user.id, recipientId, postId || null));

    if (!conversation && !postId) {
        throw new ApiError(400, 'Post ID is required to start a new conversation');
    }

    // Connectivity Check
    if (!conversation) {
        const connectionFilter = {
            $or: [
                { requester: req.user.id, recipient: recipientId, status: 'accepted' },
                { requester: recipientId, recipient: req.user.id, status: 'accepted' },
                { requester: req.user.id, recipient: recipientId, status: 'approved' },
                { requester: recipientId, recipient: req.user.id, status: 'approved' }
            ]
        };
        if (postId) {
            connectionFilter.post = postId;
        }
        const connection = await ContactRequest.findOne(connectionFilter);

        if (!connection) {
            throw new ApiError(403, 'You can only message connected users');
        }
    }

    // Create new conversation if not exists
    if (!conversation) {
        conversation = new Conversation({
            participants: [req.user.id, recipientId],
            postId: postId || null,
            expiresAt: getChatExpiryDate()
        });
        await conversation.save();
    }

    // Check for profanity
    if (containsProfanity(text)) {
        throw new ApiError(400, 'Message contains inappropriate content');
    }

    // Check if users have blocked each other
    const currentUser = await User.findById(req.user.id);
    const recipientUser = await User.findById(recipientId);

    if (!currentUser) throw new ApiError(404, 'Logged in user not found');
    if (!recipientUser) throw new ApiError(404, 'Recipient not found');

    // Ensure blockedUsers exists as an array
    const blockedUsers = currentUser.blockedUsers || [];
    if (blockedUsers.map(id => id.toString()).includes(recipientId)) {
        throw new ApiError(403, 'You have blocked this user');
    }
    const recipientBlocked = recipientUser.blockedUsers || [];
    if (recipientBlocked.map(id => id.toString()).includes(req.user.id)) {
        throw new ApiError(403, 'You cannot message this user');
    }

    const sender = {
        _id: currentUser._id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar
    };

    // 1. Save to MongoDB (Source of Truth for Counts/History)
    const mongoMessage = new Message({
        conversationId: conversation._id,
        sender: req.user.id,
        text: text,
        status: 'sent',
        readBy: [req.user.id],
        postId: postId || conversation.postId || null,
        expiresAt: getChatExpiryDate()
    });
    await mongoMessage.save();

    // 2. Save to Firestore (Real-time Layer)
    const messageData = {
        conversationId: conversation._id.toString(),
        sender: req.user.id,
        text: text,
        createdAt: mongoMessage.createdAt.toISOString(), // Sync timestamps
        status: 'sent',
        readBy: [req.user.id],
        postId: postId || conversation.postId?.toString?.() || null,
        expiresAt: admin.firestore.Timestamp.fromDate(getChatExpiryDate()),
        mongoId: mongoMessage._id.toString() // Link back to Mongo
    };

    let docRef;
    try {
        // Use MongoDB ID as Firestore Doc ID for perfect sync
        const messagesRef = db.collection('conversations').doc(conversation._id.toString()).collection('messages');
        await messagesRef.doc(mongoMessage._id.toString()).set(messageData);
        docRef = { id: mongoMessage._id.toString() };
    } catch (fsError) {
        console.error('[Firestore Error] Failed to save message:', fsError.message);
        // If Firestore fails, we SHOULD NOT rollback MongoDB, as Mongo is the persistent record.
        // But we should warn.

        // Optional: You could retry or queue this.
    }

    const savedMessage = { _id: mongoMessage._id, ...messageData, sender };

    // Update MongoDB conversation last message metadata and unhide for everyone
    conversation.lastMessage = mongoMessage._id;
    conversation.updatedAt = Date.now();
    conversation.expiresAt = getChatExpiryDate();
    conversation.deletedBy = []; // Unhide conversation for both users
    await conversation.save();

    // Socket.io for typing indicators/legacy still works if needed
    const io = req.app.get('io');
    if (io) {
        io.to(`user:${recipientId}`).emit('receive_message', {
            conversationId: conversation._id,
            message: savedMessage
        });

        // Send notification inline since io cannot be serialized for queue
        try {
            await createNotification(io, {
                recipient: recipientId,
                sender: req.user.id,
                type: 'message',
                title: 'New Message',
                message: `${currentUser.displayName || 'Someone'}: ${getNotificationMessagePreview(text)}`,
                link: '/chat',
                conversationId: conversation._id.toString()
            });
        } catch (notificationError) {
            console.error('[Notification Error] Failed to create message notification:', notificationError.message);
        }
    }

    res.json(savedMessage);
});

// @desc    Initialize Chat (Get or Create Conversation with specific user)
// @route   POST /api/chat/init/:userId
// @access  Private
exports.initChat = asyncHandler(async (req, res, next) => {
    const recipientId = req.params.userId;
    const postId = req.body?.postId || req.query?.postId || null;

    if (!postId) {
        throw new ApiError(400, 'Post ID is required to start a conversation');
    }

    // Check if conversation exists
    let conversation = await Conversation.findOne(buildConversationFilter(req.user.id, recipientId, postId))
    .populate('participants', ['displayName', 'avatar', 'isOnline'])
    .populate('lastMessage');

    // Connectivity Check - accept both 'accepted' (DB) and 'approved' (frontend)
    const connectionFilter = {
        $or: [
            { requester: req.user.id, recipient: recipientId, status: 'accepted' },
            { requester: recipientId, recipient: req.user.id, status: 'accepted' },
            { requester: req.user.id, recipient: recipientId, status: 'approved' },
            { requester: recipientId, recipient: req.user.id, status: 'approved' }
        ]
    };
    if (postId) {
        connectionFilter.post = postId;
    }
    const connection = await ContactRequest.findOne(connectionFilter);

    if (!connection) {
        throw new ApiError(403, 'You can only message connected users');
    }

    if (!conversation) {
        conversation = new Conversation({
            participants: [req.user.id, recipientId],
            postId: postId || connection.post || null,
            expiresAt: getChatExpiryDate()
        });
        await conversation.save();
        conversation = await Conversation.findById(conversation._id)
            .populate('participants', ['displayName', 'avatar', 'isOnline']);
    } else {
        conversation.expiresAt = getChatExpiryDate();
        conversation.deletedBy = [];
        await conversation.save();
    }

    res.json(conversation);
});

// @desc    Delete a conversation
// @route   DELETE /api/chat/conversation/:conversationId
// @access  Private
exports.deleteConversation = asyncHandler(async (req, res, next) => {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) throw new ApiError(404, 'Conversation not found');

    if (!conversation.participants.map(p => p.toString()).includes(req.user.id)) {
        throw new ApiError(401, 'Not authorized');
    }

    const io = req.app.get('io');
    await deleteConversationArtifacts({
        conversation,
        io,
        reason: 'Conversation deleted by participant'
    });

    res.json({ msg: 'Conversation permanently deleted' });
});

// @desc    Mark messages as read
// @route   PUT /api/chat/read/:conversationId
// @access  Private
exports.markRead = asyncHandler(async (req, res, next) => {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
    }
    
    if (!conversation.participants.map(p => p.toString()).includes(req.user.id)) {
        throw new ApiError(403, 'Not authorized to access this conversation');
    }

    await Message.updateMany(
        { conversationId: req.params.conversationId, sender: { $ne: req.user.id }, status: { $ne: 'read' } },
        { $set: { status: 'read' }, $addToSet: { readBy: req.user.id } }
    );

    // Emit socket event for read receipt
    const io = req.app.get('io');
    if (conversation) {
        const recipientId = conversation.participants.find(p => p.toString() !== req.user.id);
        if (io) {
            // Notify sender that message was read
            if (recipientId) {
                io.to(`user:${recipientId.toString()}`).emit('messages_read', {
                    conversationId: req.params.conversationId,
                    readerId: req.user.id
                });
            }
            // Notify reader (current user) to update unread count
            io.to(`user:${req.user.id}`).emit('unread_count_update');
        }
    }

    res.json({ msg: 'Messages marked as read' });
});

// @desc    Get total unread message count
// @route   GET /api/chat/unread/count
// @access  Private
exports.getTotalUnreadCount = asyncHandler(async (req, res) => {
    const conversationIds = await Conversation.find({ participants: req.user.id }).distinct('_id');
    const count = await Message.countDocuments({
        sender: { $ne: req.user.id },
        status: { $ne: 'read' },
        readBy: { $ne: req.user.id },
        conversationId: { $in: conversationIds }
    });
    res.json({ count });
});
