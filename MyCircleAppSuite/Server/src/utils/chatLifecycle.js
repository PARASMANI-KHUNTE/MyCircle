const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ContactRequest = require('../models/ContactRequest');
const Notification = require('../models/Notification');
const { db } = require('../config/firebase');

const deleteFirestoreConversation = async (conversationId) => {
    if (!db) return;

    const conversationDoc = db.collection('conversations').doc(conversationId.toString());
    const messagesRef = conversationDoc.collection('messages');
    const snapshot = await messagesRef.get();
    const batch = db.batch();

    snapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    await conversationDoc.delete().catch(() => {});
};

const emitConversationDeleted = (io, participants = [], conversationId, reason) => {
    if (!io) return;

    participants
        .map((participant) => participant?.toString?.() || participant)
        .filter(Boolean)
        .forEach((participantId) => {
            io.to(`user:${participantId}`).emit('conversation_deleted', {
                conversationId: conversationId.toString(),
                reason
            });
        });
};

const deleteConversationArtifacts = async ({ conversationId, conversation = null, io = null, reason = 'Conversation closed' }) => {
    const targetConversation = conversation || await Conversation.findById(conversationId).select('_id participants');
    if (!targetConversation) {
        return false;
    }

    try {
        await deleteFirestoreConversation(targetConversation._id);
    } catch (fsError) {
        console.error('[Chat Cleanup] Error deleting from Firestore:', fsError.message);
    }

    await Message.deleteMany({ conversationId: targetConversation._id });
    await ContactRequest.updateMany(
        { conversationId: targetConversation._id },
        { $set: { conversationId: null } }
    );
    await Notification.deleteMany({ conversationId: targetConversation._id });
    await Conversation.findByIdAndDelete(targetConversation._id);

    emitConversationDeleted(io, targetConversation.participants, targetConversation._id, reason);
    return true;
};

const deletePostScopedChats = async ({ postId, io = null, reason = 'Post closed' }) => {
    if (!postId) {
        return { deletedCount: 0, conversationIds: [] };
    }

    const conversations = await Conversation.find({ postId }).select('_id participants');
    for (const conversation of conversations) {
        await deleteConversationArtifacts({ conversation, io, reason });
    }

    return {
        deletedCount: conversations.length,
        conversationIds: conversations.map((conversation) => conversation._id.toString())
    };
};

module.exports = {
    deleteConversationArtifacts,
    deletePostScopedChats,
    deleteFirestoreConversation
};
