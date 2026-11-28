const mockConversationInstance = {
    _id: 'conversation-1',
    postId: null,
    save: jest.fn().mockResolvedValue(undefined),
};

const mockMessageInstance = {
    _id: 'message-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    save: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../src/config/firebase', () => {
    const set = jest.fn().mockResolvedValue(undefined);
    const messageDoc = { set };
    const messagesCollection = { doc: jest.fn(() => messageDoc) };
    const conversationDoc = { collection: jest.fn(() => messagesCollection) };
    const conversationsCollection = { doc: jest.fn(() => conversationDoc) };

    return {
        db: { collection: jest.fn(() => conversationsCollection) },
        admin: {
            firestore: {
                Timestamp: { fromDate: jest.fn(() => 'timestamp') },
            },
        },
    };
});

jest.mock('../src/models/Conversation', () => {
    const Conversation = jest.fn(() => mockConversationInstance);
    Conversation.findOne = jest.fn();
    return Conversation;
});

jest.mock('../src/models/Message', () => {
    const Message = jest.fn(() => mockMessageInstance);
    return Message;
});

jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
}));

jest.mock('../src/models/ContactRequest', () => ({
    findOne: jest.fn(),
}));

jest.mock('../src/utils/profanityFilter', () => ({
    containsProfanity: jest.fn(),
}));

jest.mock('../src/controllers/notificationController', () => ({
    createNotification: jest.fn(),
}));

jest.mock('../src/utils/chatLifecycle', () => ({
    deleteConversationArtifacts: jest.fn(),
    deletePostScopedChats: jest.fn(),
}));

const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const User = require('../src/models/User');
const ContactRequest = require('../src/models/ContactRequest');
const { containsProfanity } = require('../src/utils/profanityFilter');
const chatController = require('../src/controllers/chatController');

const currentUserId = '64b000000000000000000001';
const recipientId = '64b000000000000000000002';
const postId = '64b000000000000000000003';

const flush = () => new Promise((resolve) => setImmediate(resolve));

const createResponse = () => ({
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
});

describe('chat controller validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConversationInstance.save.mockResolvedValue(undefined);
        mockMessageInstance.save.mockResolvedValue(undefined);
        containsProfanity.mockReturnValue(false);
        ContactRequest.findOne.mockResolvedValue({ _id: 'connection-1' });
    });

    it('rejects profanity before creating a conversation', async () => {
        containsProfanity.mockReturnValue(true);
        const req = {
            user: { id: currentUserId },
            body: { recipientId, postId, text: 'bad word' },
            app: { get: jest.fn() },
        };
        const res = createResponse();
        const next = jest.fn();

        chatController.sendMessage(req, res, next);
        await flush();

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 400,
            message: 'Message contains inappropriate content',
        }));
        expect(Conversation).not.toHaveBeenCalled();
        expect(Conversation.findOne).not.toHaveBeenCalled();
    });

    it('rejects blocked recipients before creating a conversation', async () => {
        Conversation.findOne.mockResolvedValue(null);
        User.findById
            .mockResolvedValueOnce({ _id: currentUserId, blockedUsers: [recipientId] })
            .mockResolvedValueOnce({ _id: recipientId, blockedUsers: [] });

        const req = {
            user: { id: currentUserId },
            body: { recipientId, postId, text: 'hello' },
            app: { get: jest.fn() },
        };
        const res = createResponse();
        const next = jest.fn();

        chatController.sendMessage(req, res, next);
        await flush();

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 403,
            message: 'You have blocked this user',
        }));
        expect(Conversation).not.toHaveBeenCalled();
    });

    it('creates the conversation only after all checks pass', async () => {
        Conversation.findOne.mockResolvedValue(null);
        User.findById
            .mockResolvedValueOnce({ _id: currentUserId, blockedUsers: [], displayName: 'A' })
            .mockResolvedValueOnce({ _id: recipientId, blockedUsers: [] });

        const req = {
            user: { id: currentUserId },
            body: { recipientId, postId, text: 'hello' },
            app: { get: jest.fn(() => null) },
        };
        const res = createResponse();
        const next = jest.fn();

        chatController.sendMessage(req, res, next);
        await flush();

        expect(next).not.toHaveBeenCalled();
        expect(Conversation).toHaveBeenCalledWith(expect.objectContaining({
            participants: [currentUserId, recipientId],
            postId,
        }));
        expect(mockConversationInstance.save).toHaveBeenCalled();
        expect(Message).toHaveBeenCalled();
        expect(mockMessageInstance.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
    });

    it('rejects malformed recipient ids before any database work', async () => {
        const req = {
            user: { id: currentUserId },
            body: { recipientId: 'not-an-id', text: 'hello' },
            app: { get: jest.fn() },
        };
        const res = createResponse();
        const next = jest.fn();

        chatController.sendMessage(req, res, next);
        await flush();

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 400,
            message: 'Invalid recipient ID',
        }));
        expect(User.findById).not.toHaveBeenCalled();
    });

    it('checks block status before returning conversation participants', async () => {
        User.findById
            .mockResolvedValueOnce({ _id: currentUserId, blockedUsers: [] })
            .mockResolvedValueOnce({ _id: recipientId, blockedUsers: [currentUserId] });

        const req = {
            user: { id: currentUserId },
            params: { userId: recipientId },
            query: {},
        };
        const res = createResponse();
        const next = jest.fn();

        chatController.getOrCreateConversation(req, res, next);
        await flush();

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 403,
            message: 'You cannot message this user',
        }));
        expect(Conversation.findOne).not.toHaveBeenCalled();
    });

    it('returns sanitized participants for a new conversation', async () => {
        User.findById
            .mockResolvedValueOnce({
                _id: currentUserId,
                displayName: 'Current',
                avatar: 'a.png',
                isOnline: true,
                blockedUsers: [],
            })
            .mockResolvedValueOnce({
                _id: recipientId,
                displayName: 'Recipient',
                avatar: 'b.png',
                isOnline: false,
                blockedUsers: [],
            });
        Conversation.findOne.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            }),
        });

        const req = {
            user: { id: currentUserId },
            params: { userId: recipientId },
            query: {},
        };
        const res = createResponse();
        const next = jest.fn();

        chatController.getOrCreateConversation(req, res, next);
        await flush();

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            _id: null,
            participants: [
                { _id: currentUserId, displayName: 'Current', avatar: 'a.png', isOnline: true },
                { _id: recipientId, displayName: 'Recipient', avatar: 'b.png', isOnline: false },
            ],
            lastMessage: null,
            unreadCount: 0,
        });
    });
});
