import notifee from '@notifee/react-native';
import { claimForegroundDisplay, claimNotificationOpen, resetNotificationDedupe } from '../src/utils/notificationDedupe';
import { presentForegroundNotification } from '../src/services/notificationService';

describe('notification dedupe', () => {
    beforeEach(() => {
        resetNotificationDedupe();
        jest.clearAllMocks();
    });

    it('claims a notification id only once for display', () => {
        expect(claimForegroundDisplay({ _id: 'n1', type: 'info' })).toBe(true);
        expect(claimForegroundDisplay({ _id: 'n1', type: 'info' })).toBe(false);
        expect(claimForegroundDisplay({ _id: 'n2', type: 'info' })).toBe(true);
    });

    it('claims a notification id only once for opening', () => {
        expect(claimNotificationOpen('n1')).toBe(true);
        expect(claimNotificationOpen('n1')).toBe(false);
        expect(claimNotificationOpen('n2')).toBe(true);
    });

    it('presents the same foreground event only once', async () => {
        const payload = {
            title: 'New Request',
            body: 'Someone sent you a request.',
            data: { _id: 'n1', type: 'request' },
        };

        await expect(presentForegroundNotification(payload)).resolves.toBe(true);
        await expect(presentForegroundNotification(payload)).resolves.toBe(false);

        expect(notifee.createChannel).toHaveBeenCalledTimes(1);
        expect(notifee.displayNotification).toHaveBeenCalledTimes(1);
    });
});
