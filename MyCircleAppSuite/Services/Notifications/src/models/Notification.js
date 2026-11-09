const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    senderId: {
        type: String,
        default: null,
    },
    type: {
        type: String,
        enum: ['contact_request', 'request_accepted', 'new_message', 'post_like', 'system'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
    readAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = {
    Notification: mongoose.model('Notification', notificationSchema),
};
