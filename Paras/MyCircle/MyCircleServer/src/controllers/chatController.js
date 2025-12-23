const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const ContactRequest = require('../models/ContactRequest');
const { containsProfanity } = require('../utils/profanityFilter');
const { createNotification } = require('./notificationController');

// @desc    Get all conversations for a user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId
        })
            .sort({ createdAt: 1 }); // Oldest first

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get or Create Conversation with specific user
// @route   GET /api/chat/conversation/:userId
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Send a message
// @route   POST /api/chat/message
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, text } = req.body;

        // Check if conversation exists
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.id, recipientId] }
        });

        // Connectivity Check: Ensure an approved contact request exists
        const connection = await ContactRequest.findOne({
            $or: [
                { requester: req.user.id, recipient: recipientId, status: 'approved' },
                { requester: recipientId, recipient: req.user.id, status: 'approved' }
            ]
        });

        if (!connection) {
            return res.status(403).json({ msg: 'You can only message connected users (accepted requests)' });
        }

        // Create new conversation if not exists
        if (!conversation) {
            conversation = new Conversation({
                participants: [req.user.id, recipientId]
            });
            await conversation.save();
        }


        // Check for profanity
        if (containsProfanity(text)) {
            return res.status(400).json({ msg: 'Message contains inappropriate content. Please be respectful.' });
        }

        // Check if users have blocked each other
        const User = require('../models/User');
        const currentUser = await User.findById(req.user.id);
        const recipientUser = await User.findById(recipientId);

        if (currentUser.blockedUsers.includes(recipientId)) {
            return res.status(403).json({ msg: 'You have blocked this user.' });
        }

        if (recipientUser.blockedUsers.includes(req.user.id)) {
            return res.status(403).json({ msg: 'You cannot message this user.' });
        }

        const sender = await User.findById(req.user.id).select('displayName avatar');

        const newMessage = new Message({
            conversationId: conversation._id,
            sender: req.user.id,
            text: text,
            readBy: [req.user.id] // Mark message as read by sender immediately
        });

        // Check if sender is blocked by recipient
        // This check is now done in the notificationHelper or should be done here before saving the message
        // For now, assuming it's handled elsewhere or will be added.
        // const recipientUser = await User.findById(recipientId);
        // if (recipientUser.blockedUsers.includes(req.user.id)) {
        //     return res.status(403).json({ msg: 'You cannot message this user' });
        // }

        const savedMessage = await newMessage.save();

        // Populate the message with sender details for real-time emission
        const populatedMessage = await Message.findById(savedMessage._id)
            .populate('sender', ['displayName', 'avatar']);


        // Update conversation last message
        conversation.lastMessage = savedMessage._id;
        conversation.updatedAt = Date.now();
        await conversation.save();

        // Socket.io Real-time emission
        const io = req.app.get('io');
        if (io) {
            // Emit to recipient
            io.to(`user:${recipientId}`).emit('receive_message', {
                conversationId: conversation._id,
                message: populatedMessage
            });
        }

        // Notification removed as per user request (showing badges instead)
        /*
        await createNotification(io, {
            recipient: recipientId,
            sender: req.user.id,
            type: 'message',
            title: `New message from ${sender.displayName}`,
            message: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            relatedId: conversation._id,
            link: '/chat'
        });
        */

        res.json(populatedMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Initialize Chat (Get or Create Conversation with specific user)
// @route   POST /api/chat/init/:userId
// @access  Private
exports.initChat = async (req, res) => {
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a conversation
// @route   DELETE /api/chat/conversation/:conversationId
// @access  Private
exports.deleteConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });

        // Ensure user is participant
        if (!conversation.participants.includes(req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Hard delete for now
        await Conversation.findByIdAndDelete(req.params.conversationId);
        await Message.deleteMany({ conversationId: req.params.conversationId });

        res.json({ msg: 'Conversation deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/read/:conversationId
// @access  Private
exports.markRead = async (req, res) => {
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get total unread message count
// @route   GET /api/chat/unread/count
// @access  Private
exports.getTotalUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({
            sender: { $ne: req.user.id },
            readBy: { $ne: req.user.id },
            conversationId: { $in: await Conversation.find({ participants: req.user.id }).distinct('_id') }
        });
        res.json({ count });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
