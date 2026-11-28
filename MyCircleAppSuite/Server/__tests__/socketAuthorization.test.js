jest.mock('../src/models/Conversation', () => ({
    findOne: jest.fn(),
}));

jest.mock('../src/models/User', () => ({
    find: jest.fn(),
}));

const Conversation = require('../src/models/Conversation');
const User = require('../src/models/User');
const {
    authorizeConversationAccess,
    participantsHaveBlockedEachOther,
} = require('../src/socket/authorization');

const conversationId = '64b000000000000000000001';
const userId = '64b000000000000000000002';
const recipientId = '64b000000000000000000003';

const mockConversationLookup = (conversation) => {
    const lean = jest.fn().mockResolvedValue(conversation);
    const select = jest.fn(() => ({ lean }));
    Conversation.findOne.mockReturnValue({ select });
    return { select, lean };
};

const mockUserLookup = (users) => {
    const lean = jest.fn().mockResolvedValue(users);
    const select = jest.fn(() => ({ lean }));
    User.find.mockReturnValue({ select });
    return { select, lean };
};

describe('socket conversation authorization', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects malformed conversation ids without touching the database', async () => {
        const result = await authorizeConversationAccess({
            conversationId: 'not-an-object-id',
            userId,
        });

        expect(result).toEqual({
            allowed: false,
            reason: 'not_a_participant',
            conversation: null,
        });
        expect(Conversation.findOne).not.toHaveBeenCalled();
    });

    it('rejects users who do not participate in the conversation', async () => {
        mockConversationLookup(null);

        const result = await authorizeConversationAccess({ conversationId, userId });

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('not_a_participant');
        expect(Conversation.findOne).toHaveBeenCalledWith(expect.objectContaining({
            _id: conversationId,
            participants: userId,
            isActive: { $ne: false },
        }));
    });

    it('rejects a recipient who is not part of the conversation', async () => {
        mockConversationLookup({ _id: conversationId, participants: [userId, '64b000000000000000000009'] });

        const result = await authorizeConversationAccess({
            conversationId,
            userId,
            recipientId,
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('recipient_not_a_participant');
        expect(User.find).not.toHaveBeenCalled();
    });

    it('rejects conversations where a participant has blocked another', async () => {
        mockConversationLookup({ _id: conversationId, participants: [userId, recipientId] });
        mockUserLookup([
            { _id: userId, blockedUsers: [] },
            { _id: recipientId, blockedUsers: [userId] },
        ]);

        const result = await authorizeConversationAccess({
            conversationId,
            userId,
            recipientId,
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('blocked');
    });

    it('allows active conversations with unblocked participants', async () => {
        mockConversationLookup({ _id: conversationId, participants: [userId, recipientId] });
        mockUserLookup([
            { _id: userId, blockedUsers: [] },
            { _id: recipientId, blockedUsers: [] },
        ]);

        const result = await authorizeConversationAccess({
            conversationId,
            userId,
            recipientId,
        });

        expect(result.allowed).toBe(true);
        expect(result.reason).toBeNull();
    });
});

describe('participantsHaveBlockedEachOther', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('ignores duplicate or missing participant ids', async () => {
        await expect(participantsHaveBlockedEachOther([userId, userId])).resolves.toBe(false);
        expect(User.find).not.toHaveBeenCalled();
    });

    it('detects a block in either direction', async () => {
        mockUserLookup([
            { _id: userId, blockedUsers: [recipientId] },
            { _id: recipientId, blockedUsers: [] },
        ]);

        await expect(participantsHaveBlockedEachOther([userId, recipientId])).resolves.toBe(true);
    });
});
