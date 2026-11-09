const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: String, // User IDs from Identity Service
        required: true,
    }],
    postId: {
        type: String,
        default: null,
    },
    lastMessage: {
        type: String,
        default: '',
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {},
    },
}, {
    timestamps: true,
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true,
    },
    senderId: {
        type: String,
        required: true,
    },
    recipientId: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
        maxlength: 2000,
    },
    read: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = {
    Conversation: mongoose.model('Conversation', conversationSchema),
    Message: mongoose.model('Message', messageSchema),
};
