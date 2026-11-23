jest.mock('../src/models/ContactRequest', () => ({
    findById: jest.fn(),
    find: jest.fn(),
    deleteMany: jest.fn(),
}));

jest.mock('../src/models/Post', () => ({
    findById: jest.fn(),
}));

jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
}));

jest.mock('../src/models/Notification', () => ({
    deleteMany: jest.fn(),
}));

jest.mock('../src/utils/chatLifecycle', () => ({
    deletePostScopedChats: jest.fn().mockResolvedValue({ deletedCount: 0 }),
}));

jest.mock('../src/controllers/notificationController', () => ({
    createNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/utils/trustScore', () => ({
    applyNewRating: jest.fn(),
    refreshTrustScore: jest.fn().mockResolvedValue(undefined),
}));

const ContactRequest = require('../src/models/ContactRequest');
const Post = require('../src/models/Post');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');
const { updateRequestStatus } = require('../src/controllers/contactController');
const { updatePostStatus } = require('../src/controllers/postController');

const ownerId = 'owner-1';
const requesterId = 'requester-1';
const postId = 'post-1';
const requestId = 'request-1';

const buildRequest = (status = 'accepted') => ({
    _id: requestId,
    requester: requesterId,
    recipient: ownerId,
    post: postId,
    status,
    ratings: [],
    save: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn().mockResolvedValue(undefined),
});

const buildPost = () => ({
    _id: postId,
    user: ownerId,
    title: 'Test post',
    status: 'active',
    save: jest.fn().mockResolvedValue(undefined),
});

const buildReq = (body, params = {}) => ({
    body,
    params,
    user: { id: ownerId },
    app: { get: jest.fn().mockReturnValue({ to: jest.fn() }) },
});

describe('completed request retention', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        ContactRequest.deleteMany.mockResolvedValue({ deletedCount: 2 });
        Notification.deleteMany.mockResolvedValue({ deletedCount: 0 });
        User.findById.mockResolvedValue({ stats: { tasksCompleted: 0 } });
    });

    it('persists the completed request and only deletes the other requests for the post', async () => {
        const request = buildRequest();
        ContactRequest.findById.mockResolvedValue(request);
        ContactRequest.find.mockReturnValue({
            select: jest.fn().mockResolvedValue([{ _id: 'request-2' }, { _id: 'request-3' }]),
        });
        Post.findById.mockResolvedValue(buildPost());
        const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
        const next = jest.fn();

        await updateRequestStatus(buildReq({ status: 'completed' }, { id: requestId }), res, next);

        expect(next).not.toHaveBeenCalled();
        expect(request.status).toBe('completed');
        expect(request.save).toHaveBeenCalled();
        expect(ContactRequest.deleteMany).toHaveBeenCalledWith({
            post: postId,
            _id: { $ne: requestId },
        });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            removed: false,
            completedRequestId: requestId,
            deletedRequestIds: ['request-2', 'request-3'],
            postId,
        }));
        const response = res.json.mock.calls[0][0];
        expect(response.request.status).toBe('completed');
        expect(response.request.canRate).toBe(true);
        expect(response.request.canMarkComplete).toBe(false);
    });

    it('keeps completed requests when a post is later closed via the status endpoint', async () => {
        Post.findById.mockResolvedValue(buildPost());
        ContactRequest.find.mockReturnValue({
            select: jest.fn().mockResolvedValue([{ requester: requesterId }]),
        });
        const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
        const next = jest.fn();

        await updatePostStatus(buildReq({ status: 'completed' }, { id: postId }), res, next);

        expect(next).not.toHaveBeenCalled();
        expect(ContactRequest.deleteMany).toHaveBeenCalledWith({
            post: postId,
            status: { $nin: ['completed'] },
        });
    });
});
