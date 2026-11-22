jest.mock('../src/models/ContactRequest', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));

jest.mock('../src/models/Post', () => ({
    findById: jest.fn(),
}));

jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
}));

jest.mock('../src/controllers/notificationController', () => ({
    createNotification: jest.fn().mockResolvedValue(undefined),
}));

const ContactRequest = require('../src/models/ContactRequest');
const Post = require('../src/models/Post');
const User = require('../src/models/User');
const { createNotification } = require('../src/controllers/notificationController');
const { createRequest } = require('../src/controllers/contactController');

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('createRequest recipient', () => {
    const ownerId = 'owner-1';
    const requesterId = 'requester-1';

    beforeEach(() => {
        jest.clearAllMocks();
        Post.findById.mockResolvedValue({ _id: 'post-1', user: ownerId, title: 'Test post', type: 'service' });
        ContactRequest.findOne
            .mockResolvedValueOnce(null)
            .mockReturnValueOnce({ sort: jest.fn().mockResolvedValue(null) });
        ContactRequest.create.mockImplementation(async (fields) => ({
            ...fields,
            populate: jest.fn().mockResolvedValue(undefined),
            toObject: jest.fn().mockReturnValue({ ...fields, requester: { displayName: 'Requester' } }),
        }));
        User.findById.mockImplementation(async (id) => ({ _id: id, blockedUsers: [] }));
    });

    it('always uses the post owner as recipient, ignoring a client-supplied recipientId', async () => {
        const req = {
            user: { id: requesterId },
            body: { postId: 'post-1', recipientId: 'victim-2', message: 'Hello' },
            params: {},
            app: { get: jest.fn().mockReturnValue({ to: jest.fn() }) },
        };
        const res = { json: jest.fn() };
        const next = jest.fn();

        createRequest(req, res, next);
        await flush();

        expect(next).not.toHaveBeenCalled();
        expect(ContactRequest.create).toHaveBeenCalledWith(expect.objectContaining({
            requester: requesterId,
            recipient: ownerId,
            post: 'post-1',
        }));
        expect(createNotification).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ recipient: ownerId })
        );
    });
});
