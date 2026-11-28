const mockSave = jest.fn().mockResolvedValue({ _id: 'post-1' });
const mockPopulate = jest.fn().mockResolvedValue({ _id: 'post-1', title: 'Need a plumber' });

const mockPostModel = jest.fn(function Post(data) {
    this.data = data;
    this.save = mockSave;
});
mockPostModel.findById = jest.fn(() => ({ populate: mockPopulate }));

jest.mock('../src/models/Post', () => mockPostModel);
jest.mock('../src/utils/queue', () => ({ addImageJob: jest.fn() }));
jest.mock('../src/config/firebase', () => ({ db: {} }));
jest.mock('../src/controllers/notificationController', () => ({ createNotification: jest.fn() }));
jest.mock('../src/utils/chatLifecycle', () => ({ deletePostScopedChats: jest.fn() }));

const { createPost, updatePostStatus } = require('../src/controllers/postController');
const { createNotification } = require('../src/controllers/notificationController');
const { addImageJob } = require('../src/utils/queue');
const ContactRequest = require('../src/models/ContactRequest');

describe('createPost payload', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSave.mockResolvedValue({ _id: 'post-1' });
        mockPopulate.mockResolvedValue({ _id: 'post-1', title: 'Need a plumber' });
    });

    it('persists subtype and job type sent by the clients', async () => {
        const req = {
            body: {
                type: 'job',
                subType: 'hiring',
                jobType: 'plumbing',
                itemCategory: '',
                title: 'Need a plumber',
                description: 'Kitchen sink is leaking',
                location: 'Connaught Place, New Delhi',
                latitude: '28.6139',
                longitude: '77.2090',
                locationSource: 'map',
                price: '500',
                duration: '10080',
                exchangePreference: 'money',
                isUrgent: 'false',
                acceptsBarter: 'false',
            },
            user: { id: 'user-1' },
            app: { get: jest.fn() },
        };
        const res = { json: jest.fn() };
        const next = jest.fn();

        await createPost(req, res, next);
        await new Promise(resolve => setImmediate(resolve));

        expect(next).not.toHaveBeenCalled();
        expect(mockPostModel).toHaveBeenCalledWith(expect.objectContaining({
            subType: 'hiring',
            jobType: 'plumbing',
            title: 'Need a plumber',
            locationSource: 'map',
            locationCoords: {
                type: 'Point',
                coordinates: [77.209, 28.6139],
            },
            price: 500,
        }));
        expect(mockSave).toHaveBeenCalled();
        expect(mockPostModel.findById).toHaveBeenCalled();
        expect(mockPopulate).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ _id: 'post-1' });
    });

    it('queues image optimization after saving the post with its real id', async () => {
        const callOrder = [];
        const imagePath = 'https://res.cloudinary.com/demo/image/upload/v1/mycircle_posts/abc.jpg';

        mockSave.mockImplementationOnce(async () => {
            callOrder.push('save');
            return { _id: 'post-42' };
        });
        addImageJob.mockImplementation(async () => {
            callOrder.push('queue');
            return null;
        });

        const req = {
            body: { type: 'service', title: 'Bike repair' },
            files: [{ path: imagePath }],
            user: { id: 'user-1' },
            app: { get: jest.fn() },
        };
        const res = { json: jest.fn() };
        const next = jest.fn();

        await createPost(req, res, next);
        await new Promise(resolve => setImmediate(resolve));

        expect(addImageJob).toHaveBeenCalledWith(
            expect.objectContaining({ imagePath, postId: 'post-42', action: 'optimize' }),
            { priority: 2 }
        );
        expect(callOrder).toEqual(['save', 'queue']);
        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ _id: 'post-42' });
    });

    it('notifies affected requesters when a post status changes', async () => {
        const post = {
            _id: 'post-1',
            title: 'Need a plumber',
            user: 'user-1',
            status: 'active',
            isActive: true,
            save: jest.fn().mockResolvedValue(undefined),
        };
        mockPostModel.findById.mockReturnValueOnce(post);
        const findSpy = jest.spyOn(ContactRequest, 'find').mockReturnValue({
            select: jest.fn().mockResolvedValue([
                { requester: 'user-2' },
                { requester: 'user-3' },
            ]),
        });

        const req = {
            params: { id: 'post-1' },
            body: { status: 'inactive' },
            user: { id: 'user-1' },
            app: { get: jest.fn() },
        };
        const res = { json: jest.fn() };

        await updatePostStatus(req, res, jest.fn());

        expect(findSpy).toHaveBeenCalled();
        expect(createNotification).toHaveBeenCalledWith(undefined, expect.objectContaining({
            recipient: 'user-2',
            event: 'post_status_changed',
            relatedId: 'post-1',
        }));
        expect(createNotification).toHaveBeenCalledWith(undefined, expect.objectContaining({
            recipient: 'user-3',
            event: 'post_status_changed',
        }));
        expect(res.json).toHaveBeenCalledWith(post);
        findSpy.mockRestore();
    });
});
