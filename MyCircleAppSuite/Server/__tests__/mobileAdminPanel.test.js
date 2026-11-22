jest.mock('../src/models/User', () => ({
    countDocuments: jest.fn(),
    findById: jest.fn(),
}));

jest.mock('../src/models/Post', () => ({
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
}));

jest.mock('../src/models/ContactRequest', () => ({
    countDocuments: jest.fn(),
}));

jest.mock('../src/models/SupportSubmission', () => ({
    countDocuments: jest.fn(),
}));

const User = require('../src/models/User');
const Post = require('../src/models/Post');
const ContactRequest = require('../src/models/ContactRequest');
const SupportSubmission = require('../src/models/SupportSubmission');
const adminController = require('../src/controllers/adminController');

const flush = () => new Promise((resolve) => setImmediate(resolve));

const buildQuery = (result) => {
    const query = {};
    for (const method of ['populate', 'sort', 'skip', 'limit']) {
        query[method] = jest.fn().mockReturnValue(query);
    }
    query.lean = jest.fn().mockResolvedValue(result);
    return query;
};

describe('mobile admin APIs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns platform progress counts', async () => {
        User.countDocuments.mockResolvedValueOnce(10).mockResolvedValueOnce(2);
        Post.countDocuments.mockResolvedValue(25);
        ContactRequest.countDocuments.mockResolvedValue(7);
        SupportSubmission.countDocuments.mockResolvedValueOnce(3).mockResolvedValueOnce(8);

        const res = { json: jest.fn() };
        adminController.getOverview({}, res, jest.fn());
        await flush();

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            users: 10,
            posts: 25,
            deals: 7,
            openReports: 3,
            openSubmissions: 8,
            suspendedUsers: 2,
        }));
    });

    it('suspends a user without changing the acting admin', async () => {
        const target = { accountStatus: 'active', save: jest.fn().mockResolvedValue(undefined) };
        User.findById
            .mockResolvedValueOnce(target)
            .mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({ ...target }),
                }),
            });
        const res = { json: jest.fn() };
        const next = jest.fn();

        adminController.updateUserStatus[1]({
            params: { id: '507f1f77bcf86cd799439011' },
            body: { status: 'suspended' },
            user: { id: 'admin-1' },
        }, res, next);
        await flush();

        expect(target.accountStatus).toBe('suspended');
        expect(target.save).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Account status updated' }));
    });

    it('refuses to suspend the acting admin', async () => {
        const next = jest.fn();

        adminController.updateUserStatus[1]({
            params: { id: '507f1f77bcf86cd799439011' },
            body: { status: 'suspended' },
            user: { id: '507f1f77bcf86cd799439011' },
        }, { json: jest.fn() }, next);
        await flush();

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        expect(User.findById).not.toHaveBeenCalled();
    });

    it('filters the moderation list and updates a post status', async () => {
        Post.find.mockReturnValue(buildQuery([]));
        Post.countDocuments.mockResolvedValue(0);
        const res = { json: jest.fn() };

        adminController.listPosts({ query: { moderationStatus: 'hidden', page: '1' } }, res, jest.fn());
        await flush();

        expect(Post.find).toHaveBeenCalledWith({ moderationStatus: 'hidden' });

        const post = { moderationStatus: 'visible', save: jest.fn().mockResolvedValue(undefined) };
        Post.findById.mockResolvedValue(post);
        const updateRes = { json: jest.fn() };

        adminController.updatePostModeration[1]({
            params: { id: '507f1f77bcf86cd799439012' },
            body: { moderationStatus: 'hidden' },
        }, updateRes, jest.fn());
        await flush();

        expect(post.moderationStatus).toBe('hidden');
        expect(post.save).toHaveBeenCalled();
        expect(updateRes.json).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Post moderation status updated' }));
    });
});
