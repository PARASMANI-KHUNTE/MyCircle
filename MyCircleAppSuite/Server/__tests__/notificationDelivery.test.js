jest.mock('../src/models/Notification', () => {
    const instance = {
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn(),
    };
    const MockNotification = jest.fn((fields) => {
        Object.assign(instance, fields || {});
        return instance;
    });
    instance.toObject.mockImplementation(() => ({ ...instance }));
    MockNotification.__instance = instance;
    return MockNotification;
});

jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
}));

jest.mock('../src/utils/notificationBus', () => ({
    publishNotification: jest.fn().mockResolvedValue(false),
    onNotification: jest.fn(() => jest.fn()),
}));

const Notification = require('../src/models/Notification');
const User = require('../src/models/User');
const { publishNotification } = require('../src/utils/notificationBus');
const {
    createNotification,
    registerDeviceToken,
    unregisterDeviceToken,
} = require('../src/controllers/notificationController');

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('notification delivery', () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));

    beforeEach(() => {
        jest.clearAllMocks();
        publishNotification.mockResolvedValue(false);
        Notification.__instance._id = 'notification-1';
        Notification.__instance.read = false;
        to.mockReturnValue({ emit });
    });

    it('emits a single realtime payload with the stable event and post id', async () => {
        const io = { to };

        await createNotification(io, {
            recipient: 'user-1',
            sender: 'user-2',
            type: 'info',
            event: 'post_status_changed',
            title: 'Post Status Updated',
            message: 'The post is now completed.',
            link: '/post/post-1',
            relatedId: 'post-1',
        });

        expect(Notification).toHaveBeenCalledWith(expect.objectContaining({
            event: 'post_status_changed',
            type: 'info',
            link: '/post/post-1',
        }));
        expect(to).toHaveBeenCalledWith('user:user-1');
        expect(emit).toHaveBeenCalledWith('new_notification', expect.objectContaining({
            event: 'post_status_changed',
            postId: 'post-1',
            read: false,
        }));
    });

    it('publishes to the cross-process bus instead of emitting locally when Redis is available', async () => {
        publishNotification.mockResolvedValue(true);

        await createNotification({ to }, {
            recipient: 'user-1',
            sender: 'user-2',
            type: 'info',
            event: 'application_rejected',
            title: 'Request Rejected',
            message: 'Your request was rejected.',
        });

        expect(publishNotification).toHaveBeenCalledWith({
            recipientId: 'user-1',
            notification: expect.objectContaining({ event: 'application_rejected' }),
        });
        expect(to).not.toHaveBeenCalled();
    });

    it('does not notify the actor about their own action', async () => {
        await createNotification({ to }, {
            recipient: 'user-1',
            sender: 'user-1',
            type: 'info',
            title: 'Update',
            message: 'You updated your post.',
        });

        expect(Notification).not.toHaveBeenCalled();
        expect(to).not.toHaveBeenCalled();
    });
});

describe('device token registration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('stores a new token for the authenticated user', async () => {
        const user = { pushTokens: [], save: jest.fn().mockResolvedValue(undefined) };
        User.findById.mockResolvedValue(user);
        const req = { user: { id: 'user-1' }, body: { token: 'token-1', platform: 'android' } };
        const res = { json: jest.fn() };

        await registerDeviceToken(req, res, jest.fn());
        await flush();

        expect(user.pushTokens).toEqual([expect.objectContaining({
            token: 'token-1',
            platform: 'android',
        })]);
        expect(user.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
    });

    it('clears every token on logout when no token is supplied', async () => {
        const req = { user: { id: 'user-1' }, body: {} };
        const res = { json: jest.fn() };

        await unregisterDeviceToken(req, res, jest.fn());
        await flush();

        expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user-1', { $set: { pushTokens: [] } });
        expect(res.json).toHaveBeenCalled();
    });
});
