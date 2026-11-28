const {
    getNotificationCategory,
    isWithinQuietHours,
    shouldDeliverNotification,
} = require('../src/utils/notificationPreferences');

describe('notification preferences', () => {
    it('maps notification events to granular categories', () => {
        expect(getNotificationCategory({ event: 'new_application' })).toBe('contactRequests');
        expect(getNotificationCategory({ type: 'message' })).toBe('messages');
        expect(getNotificationCategory({ title: 'Post Expiring Soon' })).toBe('postExpiry');
        expect(getNotificationCategory({ event: 'post_status_changed' })).toBe(null);
    });

    it('respects overnight quiet windows in the configured timezone', () => {
        const quietHours = { enabled: true, start: '22:00', end: '07:00', timezone: 'UTC' };

        expect(isWithinQuietHours(quietHours, new Date('2026-01-15T23:30:00Z'))).toBe(true);
        expect(isWithinQuietHours(quietHours, new Date('2026-01-15T06:30:00Z'))).toBe(true);
        expect(isWithinQuietHours(quietHours, new Date('2026-01-15T12:00:00Z'))).toBe(false);
        expect(isWithinQuietHours({ ...quietHours, enabled: false }, new Date('2026-01-15T23:30:00Z'))).toBe(false);
    });

    it('ignores malformed quiet windows', () => {
        expect(isWithinQuietHours({ enabled: true, start: 'bad', end: '07:00' }, new Date())).toBe(false);
        expect(isWithinQuietHours({ enabled: true, start: '09:00', end: '09:00' }, new Date())).toBe(false);
    });

    it('suppresses delivery for a disabled category', async () => {
        const UserModel = {
            findById: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue({
                    preferences: { notificationCategories: { messages: false } },
                }),
            })),
        };

        await expect(shouldDeliverNotification(
            UserModel,
            'user-1',
            { event: 'message' },
            new Date('2026-01-15T12:00:00Z')
        )).resolves.toBe(false);
    });

    it('fails open when preferences cannot be loaded', async () => {
        const UserModel = {
            findById: jest.fn(() => {
                throw new Error('database unavailable');
            }),
        };

        await expect(shouldDeliverNotification(UserModel, 'user-1', { event: 'message' })).resolves.toBe(true);
    });
});
