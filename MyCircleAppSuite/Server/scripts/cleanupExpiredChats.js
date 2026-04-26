const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Conversation = require('../src/models/Conversation');
const { deleteConversationArtifacts } = require('../src/utils/chatLifecycle');

const run = async () => {
    await connectDB();

    const expiredConversations = await Conversation.find({
        expiresAt: { $lt: new Date() }
    }).select('_id participants');

    for (const conversation of expiredConversations) {
        await deleteConversationArtifacts({
            conversation,
            reason: 'Expired after 24 hours'
        });
    }

    console.log(`[Script] Removed ${expiredConversations.length} expired conversations.`);
    await mongoose.connection.close();
};

run().catch(async (error) => {
    console.error('[Script] cleanupExpiredChats failed:', error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
});
