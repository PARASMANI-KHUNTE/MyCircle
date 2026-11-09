const mongoose = require('mongoose');

const contactRequestSchema = new mongoose.Schema({
    postId: {
        type: String,
        required: true,
        index: true,
    },
    requesterId: {
        type: String,
        required: true,
        index: true,
    },
    recipientId: {
        type: String,
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'approved', 'rejected', 'expired', 'completed', 'canceled'],
        default: 'pending',
        index: true,
    },
    message: {
        type: String,
        maxlength: 500,
        default: '',
    },
    conversationId: {
        type: String,
        default: null,
    },
    expiresAt: {
        type: Date,
        index: true,
    },
    acceptedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

contactRequestSchema.index({ requesterId: 1, recipientId: 1, postId: 1 });

module.exports = {
    ContactRequest: mongoose.model('ContactRequest', contactRequestSchema),
};
