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
    // Stable event name for client routing. `type` stays for backwards compatibility.
    event: {
        type: String,
        enum: [
            'new_application',
            'contact_request',
            'application_accepted',
            'application_rejected',
            'post_status_changed',
            'message',
            'like',
            'comment',
            'system',
        ],
        default: 'system',
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
    },
    conversationId: { // Specifically for chat navigation
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ relatedId: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
