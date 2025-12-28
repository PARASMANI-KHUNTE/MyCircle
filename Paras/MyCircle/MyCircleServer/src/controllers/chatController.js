const Conversation = require('../models/Conversation');
const Message = require('../models/Message'); // Kept for legacy/fallback? Actually we start fresh.
const User = require('../models/User');
const ContactRequest = require('../models/ContactRequest');
const { containsProfanity } = require('../utils/profanityFilter');
const { createNotification } = require('./notificationController');
const { db, admin } = require('../config/firebase');

// @desc    Get all conversations for a user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
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
    } catch (err) {
        return next(err);
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res, next) => {
    try {
        if (!db) return res.status(500).json({ msg: 'Firebase not initialized' });

        const messagesRef = db.collection('conversations').doc(req.params.conversationId).collection('messages');
        const snapshot = await messagesRef.orderBy('createdAt', 'asc').get();

        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ _id: doc.id, ...doc.data() });
        });

        res.json(messages);
    } catch (err) {
        return next(err);
    }
};

// @desc    Get or Create Conversation with specific user
// @route   GET /api/chat/conversation/:userId
// @access  Private
exports.getOrCreateConversation = async (req, res, next) => {
    try {
        const recipientId = req.params.userId;

        // Check if conversation exists
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.id, recipientId] }
        })
            .populate('participants', ['displayName', 'avatar', 'isOnline'])
            .populate('lastMessage');

        // If conversation doesn't exist, return conversation structure without creating
        if (!conversation) {
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
    } catch (err) {
        return next(err);
    }
};

// @desc    Send a message
// @route   POST /api/chat/message
// @access  Private
// @desc    Send a message
// @route   POST /api/chat/message
// @access  Private
exports.sendMessage = async (req, res, next) => {
    try {
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
                return res.status(403).json({ msg: 'You can only message connected users' });
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
            return res.status(400).json({ msg: 'Message contains inappropriate content.' });
        }

        // Check if users have blocked each other
        const currentUser = await User.findById(req.user.id);
        const recipientUser = await User.findById(recipientId);

        if (currentUser.blockedUsers.includes(recipientId)) {
            return res.status(403).json({ msg: 'You have blocked this user.' });
        }
        if (recipientUser.blockedUsers.includes(req.user.id)) {
            return res.status(403).json({ msg: 'You cannot message this user.' });
        }

        const sender = {
            _id: currentUser._id,
            displayName: currentUser.displayName,
            avatar: currentUser.avatar
        };

        // Save to Firestore
        const messageData = {
            conversationId: conversation._id.toString(),
            sender: req.user.id,
            text: text,
            createdAt: new Date().toISOString(),
            status: 'sent',
            readBy: [req.user.id],
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7-day TTL
        };

        const messagesRef = db.collection('conversations').doc(conversation._id.toString()).collection('messages');
        const docRef = await messagesRef.add(messageData);

        const savedMessage = { _id: docRef.id, ...messageData, sender };

        // Update MongoDB conversation last message metadata
        conversation.updatedAt = Date.now();
        // We can still store a 'Message' ref if we want, but it's not strictly needed for Firestore.
        // For simplicity, let's keep it minimal.
        await conversation.save();

        // Socket.io for typing indicators/legacy still works if needed
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${recipientId}`).emit('receive_message', {
                conversationId: conversation._id,
                message: savedMessage
            });
        }

        res.json(savedMessage);
    } catch (err) {
        return next(err);
    }
};

// @desc    Initialize Chat (Get or Create Conversation with specific user)
// @route   POST /api/chat/init/:userId
// @access  Private
exports.initChat = async (req, res, next) => {
    try {
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
            return res.status(403).json({ msg: 'You can only message connected users' });
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
    } catch (err) {
        return next(err);
    }
};

// @desc    Delete a conversation
// @route   DELETE /api/chat/conversation/:conversationId
// @access  Private
// @desc    Delete a conversation
// @route   DELETE /api/chat/conversation/:conversationId
// @access  Private
exports.deleteConversation = async (req, res, next) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });

        if (!conversation.participants.includes(req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Add user to deletedBy
        if (!conversation.deletedBy.includes(req.user.id)) {
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
    } catch (err) {
        return next(err);
    }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/read/:conversationId
// @access  Private
exports.markRead = async (req, res, next) => {
    try {
        await Message.updateMany(
            { conversationId: req.params.conversationId, sender: { $ne: req.user.id }, status: { $ne: 'read' } },
            { $set: { status: 'read' }, $addToSet: { readBy: req.user.id } }
        );

        // Emit socket event for read receipt
        const io = req.app.get('io');
        const conversation = await Conversation.findById(req.params.conversationId);
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
    } catch (err) {
        return next(err);
    }
};

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
