const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Conversation = require('../src/models/Conversation');
const ContactRequest = require('../src/models/ContactRequest');

const run = async () => {
    await connectDB();

    const acceptedRequests = await ContactRequest.find({
        status: { $in: ['accepted', 'approved'] }
    }).select('_id requester recipient post conversationId');

    let repaired = 0;
    let cleared = 0;

    for (const request of acceptedRequests) {
        const conversation = await Conversation.findOne({
            participants: { $all: [request.requester, request.recipient] },
            postId: request.post
        }).select('_id');

        if (conversation && (!request.conversationId || request.conversationId.toString() !== conversation._id.toString())) {
            request.conversationId = conversation._id;
            await request.save();
            repaired += 1;
            continue;
        }

        if (!conversation && request.conversationId) {
            request.conversationId = null;
            await request.save();
            cleared += 1;
        }
    }

    console.log(`[Script] Repaired request conversation links: ${repaired}`);
    console.log(`[Script] Cleared orphaned request links: ${cleared}`);

    await mongoose.connection.close();
};

run().catch(async (error) => {
    console.error('[Script] repairPostConversations failed:', error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
});
