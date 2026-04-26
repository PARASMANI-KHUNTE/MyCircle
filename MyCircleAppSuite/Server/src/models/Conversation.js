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
    isActive: {
        type: Boolean,
        default: true
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
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
        index: { expireAfterSeconds: 0 }
    }
}, { timestamps: true });

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ participants: 1, updatedAt: -1 });
ConversationSchema.index({ participants: 1, postId: 1, updatedAt: -1 });
ConversationSchema.index({ deletedBy: 1, updatedAt: -1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ postId: 1 });
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);

let cleanupRegistered = false;

if (!cleanupRegistered) {
    cleanupRegistered = true;
    mongoose.connection.on('open', async () => {
        try {
            const collection = mongoose.connection.db.collection('conversations');
            const indexes = await collection.indexes();
            const invalidIndex = indexes.find((index) => {
                const keyFields = Object.keys(index.key || {});
                return keyFields.includes('participants') && keyFields.includes('deletedBy');
            });

            if (invalidIndex?.name) {
                await collection.dropIndex(invalidIndex.name);
            }
        } catch (error) {
            if (error?.codeName !== 'IndexNotFound') {
                console.error('[Conversation Index Cleanup] Failed to drop invalid index:', error.message);
            }
        }
    });
}

module.exports = Conversation;
