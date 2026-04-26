const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const ContactRequest = require('../src/models/ContactRequest');
const Notification = require('../src/models/Notification');
const { deletePostScopedChats } = require('../src/utils/chatLifecycle');

const postIdArg = process.argv.find((arg) => arg.startsWith('--postId='));
const postId = postIdArg ? postIdArg.split('=')[1] : null;

if (!postId) {
    console.error('Usage: node scripts/resetPostConnections.js --postId=<postId>');
    process.exit(1);
}

const run = async () => {
    await connectDB();

    const chatResult = await deletePostScopedChats({
        postId,
        reason: 'Post-scoped connection reset'
    });
    const deletedRequests = await ContactRequest.deleteMany({ post: postId });
    const deletedNotifications = await Notification.deleteMany({ relatedId: postId });

    console.log(`[Script] Reset post connections for ${postId}`);
    console.log(`[Script] Deleted conversations: ${chatResult.deletedCount}`);
    console.log(`[Script] Deleted requests: ${deletedRequests.deletedCount}`);
    console.log(`[Script] Deleted notifications: ${deletedNotifications.deletedCount}`);

    await mongoose.connection.close();
};

run().catch(async (error) => {
    console.error('[Script] resetPostConnections failed:', error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
});
