jest.mock('../src/config/firebase', () => ({
    admin: { messaging: jest.fn() },
}));

jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
}));

const { admin } = require('../src/config/firebase');
const User = require('../src/models/User');
const { sendPushNotification } = require('../src/utils/pushNotifications');

const mockMessaging = (result) => {
    const sendEachForMulticast = jest.fn().mockResolvedValue(result);
    admin.messaging.mockReturnValue({ sendEachForMulticast });
    return sendEachForMulticast;
};

const mockTokens = (pushTokens) => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ pushTokens }) });
};

describe('sendPushNotification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('sends to every registered device and removes tokens rejected as stale', async () => {
        const sendEachForMulticast = mockMessaging({
            successCount: 1,
            failureCount: 1,
            responses: [
                {},
                { error: { code: 'messaging/registration-token-not-registered' } },
            ],
        });
        mockTokens([{ token: 'valid-token' }, { token: 'stale-token' }]);

        const result = await sendPushNotification({
            recipientId: 'user-1',
            title: 'New Request',
            body: 'Someone sent you a request.',
            data: { event: 'contact_request', relatedId: 'post-1' },
        });

        expect(sendEachForMulticast).toHaveBeenCalledWith({
            tokens: ['valid-token', 'stale-token'],
            notification: { title: 'New Request', body: 'Someone sent you a request.' },
            data: { event: 'contact_request', relatedId: 'post-1' },
        });
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user-1', {
            $pull: { pushTokens: { token: { $in: ['stale-token'] } } },
        });
        expect(result).toEqual({ sent: 1, removedTokens: 1 });
    });

    it('is a no-op when Firebase messaging is unavailable', async () => {
        admin.messaging.mockReturnValue(null);

        const result = await sendPushNotification({ recipientId: 'user-1', title: 'T', body: 'B' });

        expect(result).toEqual({ sent: 0, removedTokens: 0 });
        expect(User.findById).not.toHaveBeenCalled();
    });

    it('is a no-op when the user has no device tokens', async () => {
        const sendEachForMulticast = mockMessaging({ successCount: 0, failureCount: 0, responses: [] });
        mockTokens([]);

        const result = await sendPushNotification({ recipientId: 'user-1', title: 'T', body: 'B' });

        expect(result).toEqual({ sent: 0, removedTokens: 0 });
        expect(sendEachForMulticast).not.toHaveBeenCalled();
    });

    it('does not throw when FCM rejects the send', async () => {
        const sendEachForMulticast = jest.fn().mockRejectedValue(new Error('FCM unavailable'));
        admin.messaging.mockReturnValue({ sendEachForMulticast });
        mockTokens(['token-1']);

        const result = await sendPushNotification({ recipientId: 'user-1', title: 'T', body: 'B' });

        expect(result).toEqual({ sent: 0, removedTokens: 0 });
        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
});
