const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message' // We still keep a reference for metadata, though content moves to Firestore
    },
    deletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ participants: 1, updatedAt: -1 });
ConversationSchema.index({ participants: 1, deletedBy: 1, updatedAt: -1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ postId: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
