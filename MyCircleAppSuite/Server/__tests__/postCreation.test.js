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

const { createPost } = require('../src/controllers/postController');

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
});
