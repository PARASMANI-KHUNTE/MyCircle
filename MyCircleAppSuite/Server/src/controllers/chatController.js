const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const ContactRequest = require('../models/ContactRequest');
const { containsProfanity } = require('../utils/profanityFilter');
const { createNotification } = require('./notificationController');
const { db, admin } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const getNotificationMessagePreview = (messageText) => {
    if (typeof messageText !== 'string') return '';
    const normalized = messageText.replace(/\s+/g, ' ').trim();
    const maxLength = 80;
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}…` : normalized;
};

// @desc    Get all conversations for a user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
    const conversations = await Conversation.find({
        participants: req.user.id,
        deletedBy: { $ne: req.user.id }
    })
        .populate('participants', 'displayName avatar')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
        conversations.map(async (conv) => {
            const unreadCount = await Message.countDocuments({
                conversationId: conv._id,
                sender: { $ne: req.user.id },
                readBy: { $ne: req.user.id }
            });

            return {
                ...conv.toObject(),
                unreadCount
            };
        })
    );

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

    const messages = await Message.find({ conversationId: req.params.conversationId })
        .sort({ createdAt: 1 });

    res.json(messages);
});

// @desc    Get or Create Conversation with specific user
// @route   GET /api/chat/conversation/:userId
// @access  Private
exports.getOrCreateConversation = asyncHandler(async (req, res, next) => {
    const recipientId = req.params.userId;

    // Check if conversation exists
    let conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, recipientId] }
    })
        .populate('participants', ['displayName', 'avatar', 'isOnline'])
        .populate('lastMessage');

    // If conversation doesn't exist, return conversation structure without creating
    if (!conversation) {
        // Verify user is connected before returning conversation details
        const connection = await ContactRequest.findOne({
            $or: [
                { requester: req.user.id, recipient: recipientId, status: 'approved' },
                { requester: recipientId, recipient: req.user.id, status: 'approved' }
            ]
        });

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

// @desc    Send a message
// @route   POST /api/chat/message
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
    if (!db) throw new ApiError(500, 'Firebase not initialized');
    const { recipientId, text, postId } = req.body;

    // Check if conversation exists
    let conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, recipientId] }
    });

    // Connectivity Check
    if (!conversation) {
        const connection = await ContactRequest.findOne({
            $or: [
                { requester: req.user.id, recipient: recipientId, status: 'approved' },
                { requester: recipientId, recipient: req.user.id, status: 'approved' }
            ]
        });

        if (!connection) {
            throw new ApiError(403, 'You can only message connected users');
        }
    }

    // Create new conversation if not exists
    if (!conversation) {
        conversation = new Conversation({
            participants: [req.user.id, recipientId],
            postId: postId || null
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
        readBy: [req.user.id]
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
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7-day TTL
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
        await createNotification(io, {
            recipient: recipientId,
            sender: req.user.id,
            type: 'message',
            title: 'New Message',
            message: `${currentUser.displayName || 'Someone'}: ${getNotificationMessagePreview(text)}`,
            link: '/chat',
            conversationId: conversation._id.toString()
        });
    }

    res.json(savedMessage);
});

// @desc    Initialize Chat (Get or Create Conversation with specific user)
// @route   POST /api/chat/init/:userId
// @access  Private
exports.initChat = asyncHandler(async (req, res, next) => {
    const recipientId = req.params.userId;

    // Check if conversation exists
    let conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, recipientId] }
    })
        .populate('participants', ['displayName', 'avatar', 'isOnline'])
        .populate('lastMessage');

    // Connectivity Check
    const connection = await ContactRequest.findOne({
        $or: [
            { requester: req.user.id, recipient: recipientId, status: 'approved' },
            { requester: recipientId, recipient: req.user.id, status: 'approved' }
        ]
    });

    if (!connection) {
        throw new ApiError(403, 'You can only message connected users');
    }

    if (!conversation) {
        conversation = new Conversation({
            participants: [req.user.id, recipientId]
        });
        await conversation.save();
        conversation = await Conversation.findById(conversation._id)
            .populate('participants', ['displayName', 'avatar', 'isOnline']);
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

    // Add user to deletedBy
    if (!conversation.deletedBy.map(p => p.toString()).includes(req.user.id)) {
        conversation.deletedBy.push(req.user.id);
    }

    // If both users deleted it, or it was linked to a post that's gone
    // Hard delete if all participants deleted
    if (conversation.deletedBy.length === conversation.participants.length) {
        // Hard delete from Firestore too
        try {
            if (db) {
                const messagesRef = db.collection('conversations').doc(conversation._id.toString()).collection('messages');
                const snapshot = await messagesRef.get();
                const batch = db.batch();
                snapshot.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                await db.collection('conversations').doc(conversation._id.toString()).delete();
            }
        } catch (fsError) {
            console.error('Error deleting from Firestore:', fsError.message);
            // We still proceed with MongoDB deletion as that is the source of truth for metadata
        }

        await Conversation.findByIdAndDelete(req.params.conversationId);
        return res.json({ msg: 'Conversation permanently deleted' });
    }

    await conversation.save();
    res.json({ msg: 'Conversation hidden for you' });
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
exports.getTotalUnreadCount = async (req, res, next) => {
    try {
        const count = await Message.countDocuments({
            sender: { $ne: req.user.id },
            readBy: { $ne: req.user.id },
            conversationId: { $in: await Conversation.find({ participants: req.user.id }).distinct('_id') }
        });
        res.json({ count });
    } catch (err) {
        return next(err);
    }
};
