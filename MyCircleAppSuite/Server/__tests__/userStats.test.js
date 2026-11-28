jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
}));

jest.mock('../src/models/Post', () => ({
    countDocuments: jest.fn(),
}));

jest.mock('../src/models/ContactRequest', () => ({
    countDocuments: jest.fn(),
}));

const User = require('../src/models/User');
const Post = require('../src/models/Post');
const ContactRequest = require('../src/models/ContactRequest');
const userController = require('../src/controllers/userController');

const userId = '64b000000000000000000001';

describe('getUserStats', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns fresh stats without writing to the database', async () => {
        const user = {
            stats: {
                toObject: () => ({ totalPosts: 0, activePosts: 0 }),
            },
            rating: 4.5,
            reviews: ['great'],
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            save: jest.fn(),
        };

        User.findById.mockResolvedValue(user);
        Post.countDocuments
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(1);
        ContactRequest.countDocuments.mockResolvedValue(3);

        const req = { user: { id: userId } };
        const res = { json: jest.fn() };
        const next = jest.fn();

        await userController.getUserStats(req, res, next);

        expect(user.save).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            stats: {
                totalPosts: 2,
                activePosts: 1,
                receivedRequests: 3,
            },
            rating: 4.5,
            reviews: ['great'],
        }));
    });
});
