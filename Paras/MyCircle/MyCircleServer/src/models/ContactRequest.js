const mongoose = require('mongoose');

const ContactRequestSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    message: {
        type: String,
        maxLength: 200,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Ensure a user can only request once per post
ContactRequestSchema.index({ post: 1, requester: 1 }, { unique: true });

module.exports = mongoose.model('ContactRequest', ContactRequestSchema);
