const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const toId = (value) => (value == null ? null : String(value));

const isValidId = (value) => typeof value === 'string' && mongoose.isValidObjectId(value);

/**
 * Load an active conversation that the given user participates in.
 * Returns null for malformed ids, missing conversations and non-participants.
 */
const findParticipantConversation = async (conversationId, userId) => {
    if (!isValidId(conversationId) || !isValidId(userId)) {
        return null;
    }

    return Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: { $ne: false },
    })
        .select('_id participants')
        .lean();
};

/**
 * Check whether any participant has blocked another participant.
 */
const participantsHaveBlockedEachOther = async (participantIds) => {
    const ids = [...new Set((participantIds || []).map(toId).filter(Boolean))];
    if (ids.length < 2) {
        return false;
    }

    const users = await User.find({ _id: { $in: ids } })
        .select('_id blockedUsers')
        .lean();

    const participantIdSet = new Set(ids);
    return users.some((user) =>
        (user.blockedUsers || []).some((blockedId) => participantIdSet.has(toId(blockedId)))
    );
};

/**
 * Authorize access to a conversation room or typing relay.
 *
 * Access is denied unless the requesting user participates in the
 * conversation, the optional recipient also participates, and none of the
 * participants have blocked each other.
 */
const authorizeConversationAccess = async ({ conversationId, userId, recipientId }) => {
    const conversation = await findParticipantConversation(conversationId, userId);

    if (!conversation) {
        return { allowed: false, reason: 'not_a_participant', conversation: null };
    }

    const participantIds = (conversation.participants || []).map(toId);

    if (recipientId && !participantIds.includes(toId(recipientId))) {
        return { allowed: false, reason: 'recipient_not_a_participant', conversation };
    }

    if (await participantsHaveBlockedEachOther(participantIds)) {
        return { allowed: false, reason: 'blocked', conversation };
    }

    return { allowed: true, reason: null, conversation };
};

module.exports = {
    authorizeConversationAccess,
    findParticipantConversation,
    participantsHaveBlockedEachOther,
};
