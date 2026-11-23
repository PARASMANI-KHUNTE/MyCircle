jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateMany: jest.fn(),
}));

jest.mock('../src/models/Post', () => ({
    find: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
}));

jest.mock('../src/models/ContactRequest', () => ({
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
}));

jest.mock('../src/models/Conversation', () => ({
    find: jest.fn(),
}));

jest.mock('../src/models/Message', () => ({
    deleteMany: jest.fn(),
}));

jest.mock('../src/models/Notification', () => ({
    deleteMany: jest.fn(),
}));

jest.mock('../src/models/SupportSubmission', () => ({
    deleteMany: jest.fn(),
}));

jest.mock('../src/utils/chatLifecycle', () => ({
    deleteConversationArtifacts: jest.fn(),
    deletePostScopedChats: jest.fn(),
}));

jest.mock('../src/config/firebase', () => ({ admin: null, db: null }));

const User = require('../src/models/User');
const Post = require('../src/models/Post');
const ContactRequest = require('../src/models/ContactRequest');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const Notification = require('../src/models/Notification');
const SupportSubmission = require('../src/models/SupportSubmission');
const { deleteConversationArtifacts, deletePostScopedChats } = require('../src/utils/chatLifecycle');
const { deleteAccount } = require('../src/controllers/userController');

const flush = () => new Promise((resolve) => setImmediate(resolve));
const selectQuery = (result) => ({ select: jest.fn().mockResolvedValue(result) });

const deletedResult = { deletedCount: 1 };
const updatedResult = { modifiedCount: 1 };

const buildReq = () => ({
    user: { id: 'user-1' },
    app: { get: jest.fn().mockReturnValue('io-instance') },
});

describe('deleteAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        User.findById.mockReturnValue(selectQuery({ _id: 'user-1' }));
        User.findByIdAndDelete.mockResolvedValue({ _id: 'user-1' });
        User.updateMany.mockResolvedValue(updatedResult);
        Conversation.find.mockReturnValue(selectQuery([
            { _id: 'conv-1', participants: ['user-1', 'user-2'] },
        ]));
        Post.find.mockReturnValue(selectQuery([{ _id: 'post-1' }]));
        Post.deleteMany.mockResolvedValue(deletedResult);
        Post.updateMany.mockResolvedValue(updatedResult);
        ContactRequest.deleteMany.mockResolvedValue(deletedResult);
        ContactRequest.updateMany.mockResolvedValue(updatedResult);
        Message.deleteMany.mockResolvedValue(deletedResult);
        Notification.deleteMany.mockResolvedValue(deletedResult);
        SupportSubmission.deleteMany.mockResolvedValue(deletedResult);
        deleteConversationArtifacts.mockResolvedValue(true);
        deletePostScopedChats.mockResolvedValue({ deletedCount: 1, conversationIds: [] });
    });

    it('deletes the account and all associated data before responding', async () => {
        const req = buildReq();
        const res = { json: jest.fn() };
        const next = jest.fn();

        deleteAccount(req, res, next);
        await flush();

        expect(next).not.toHaveBeenCalled();
        expect(req.app.get).toHaveBeenCalledWith('io');
        expect(deleteConversationArtifacts).toHaveBeenCalledWith(expect.objectContaining({
            conversation: expect.objectContaining({ _id: 'conv-1' }),
            io: 'io-instance',
        }));
        expect(deletePostScopedChats).toHaveBeenCalledWith(expect.objectContaining({
            postId: 'post-1',
            io: 'io-instance',
        }));
        expect(Post.deleteMany).toHaveBeenCalledWith({ user: 'user-1' });
        expect(ContactRequest.deleteMany).toHaveBeenCalledWith({
            $or: [
                { requester: 'user-1' },
                { recipient: 'user-1' },
                { post: { $in: ['post-1'] } },
            ],
        });
        expect(Notification.deleteMany).toHaveBeenCalledWith({
            $or: [
                { recipient: 'user-1' },
                { sender: 'user-1' },
                { relatedId: { $in: ['post-1'] } },
            ],
        });
        expect(Message.deleteMany).toHaveBeenCalledWith({
            $or: [{ sender: 'user-1' }, { readBy: 'user-1' }],
        });
        expect(SupportSubmission.deleteMany).toHaveBeenCalledWith({
            $or: [{ reporter: 'user-1' }, { reportedUser: 'user-1' }],
        });
        expect(Post.updateMany).toHaveBeenCalledWith(
            { user: { $ne: 'user-1' } },
            expect.objectContaining({ $pull: expect.objectContaining({ likes: 'user-1' }) })
        );
        expect(ContactRequest.updateMany).toHaveBeenCalled();
        expect(User.updateMany).toHaveBeenCalledWith(
            { _id: { $ne: 'user-1' } },
            expect.objectContaining({
                $pull: expect.objectContaining({ blockedUsers: 'user-1', followers: 'user-1' }),
            })
        );
        expect(User.findByIdAndDelete).toHaveBeenCalledWith('user-1');
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Your account and associated data have been deleted.',
        });
    });

    it('returns 404 without deleting anything when the user is gone', async () => {
        User.findById.mockReturnValue(selectQuery(null));
        const req = buildReq();
        const next = jest.fn();

        deleteAccount(req, { json: jest.fn() }, next);
        await flush();

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
        expect(User.findByIdAndDelete).not.toHaveBeenCalled();
        expect(Post.deleteMany).not.toHaveBeenCalled();
    });

    it('does not delete the user when cleanup fails', async () => {
        Notification.deleteMany.mockRejectedValue(new Error('database unavailable'));
        const req = buildReq();
        const next = jest.fn();

        deleteAccount(req, { json: jest.fn() }, next);
        await flush();

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'database unavailable' }));
        expect(User.findByIdAndDelete).not.toHaveBeenCalled();
    });
});

describe('user routes', () => {
    it('registers DELETE /account behind auth', () => {
        const fs = require('fs');
        const path = require('path');
        const source = fs.readFileSync(path.join(__dirname, '../src/routes/userRoutes.js'), 'utf8');

        expect(source).toMatch(/router\.delete\('\/account', auth, userController\.deleteAccount\);/);
    });
});
