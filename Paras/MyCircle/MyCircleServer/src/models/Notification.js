const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: { // Optional: who triggered it (e.g. liker)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['request', 'approval', 'info', 'message', 'like', 'comment', 'system'],
        default: 'system'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: { // Optional: navigation target (e.g. /post/123)
        type: String
    },
    read: {
        type: Boolean,
        default: false
    },
    relatedId: { // Optional: ID of related entity (post ID, user ID etc)
        type: mongoose.Schema.Types.ObjectId
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
