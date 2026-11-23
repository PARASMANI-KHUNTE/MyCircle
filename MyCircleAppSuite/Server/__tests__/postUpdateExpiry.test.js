const mockSave = jest.fn().mockResolvedValue(undefined);
const mockPopulate = jest.fn().mockResolvedValue({ _id: 'post-1', title: 'Need a plumber' });

const mockPostModel = jest.fn();
mockPostModel.findById = jest.fn();

jest.mock('../src/models/Post', () => mockPostModel);
jest.mock('../src/utils/queue', () => ({ addImageJob: jest.fn() }));
jest.mock('../src/config/firebase', () => ({ db: {} }));
jest.mock('../src/controllers/notificationController', () => ({ createNotification: jest.fn() }));
jest.mock('../src/utils/chatLifecycle', () => ({ deletePostScopedChats: jest.fn() }));

const { updatePost } = require('../src/controllers/postController');

describe('updatePost expiry', () => {
    let post;
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        const expiresAt = new Date('2030-01-01T00:00:00.000Z');
        post = {
            _id: 'post-1',
            user: 'user-1',
            title: 'Need a plumber',
            description: 'Kitchen sink is leaking',
            type: 'job',
            location: 'Connaught Place',
            price: 500,
            duration: 10080,
            expiresAt,
            images: [],
            save: mockSave,
        };
        req = {
            params: { id: 'post-1' },
            body: {
                title: 'Updated title',
                description: 'Updated description',
                type: 'job',
                location: 'Connaught Place',
                price: '500',
                duration: '10080',
            },
            user: { id: 'user-1' },
        };
        res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
        next = jest.fn();

        mockPostModel.findById
            .mockImplementationOnce(() => post)
            .mockImplementationOnce(() => ({ populate: mockPopulate }));
    });

    it('keeps the original expiry when the duration is unchanged', async () => {
        const originalExpiry = post.expiresAt;

        await updatePost(req, res, next);

        expect(post.expiresAt).toBe(originalExpiry);
        expect(post.title).toBe('Updated title');
        expect(mockSave).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ _id: 'post-1', title: 'Need a plumber' });
    });

    it('renews expiry when the duration actually changes', async () => {
        req.body.duration = '20160';

        await updatePost(req, res, next);

        expect(post.duration).toBe(20160);
        expect(post.expiresAt).not.toBe(new Date('2030-01-01T00:00:00.000Z'));
        expect(post.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
});
