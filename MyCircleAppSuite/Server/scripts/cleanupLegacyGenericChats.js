const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Conversation = require('../src/models/Conversation');
const { deleteConversationArtifacts } = require('../src/utils/chatLifecycle');

const run = async () => {
    await connectDB();

    const legacyConversations = await Conversation.find({
        $or: [
            { postId: null },
            { postId: { $exists: false } }
        ]
    }).select('_id participants');

    for (const conversation of legacyConversations) {
        await deleteConversationArtifacts({
            conversation,
            reason: 'Legacy generic chat cleanup'
        });
    }

    console.log(`[Script] Removed ${legacyConversations.length} legacy generic conversations.`);
    await mongoose.connection.close();
};

run().catch(async (error) => {
    console.error('[Script] cleanupLegacyGenericChats failed:', error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
});
