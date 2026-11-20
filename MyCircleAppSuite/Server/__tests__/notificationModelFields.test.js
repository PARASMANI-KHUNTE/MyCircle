const Notification = require('../src/models/Notification');
const User = require('../src/models/User');

describe('notification delivery model fields', () => {
    it('persists a stable routing event', () => {
        expect(Notification.schema.path('event')).toBeDefined();
        expect(Notification.schema.path('event').enumValues).toContain('application_accepted');
        expect(Notification.schema.path('event').enumValues).toContain('application_rejected');
        expect(Notification.schema.path('event').enumValues).toContain('location_shared');
        expect(Notification.schema.path('event').enumValues).toContain('location_share_revoked');
        expect(Notification.schema.path('event').enumValues).toContain('post_status_changed');
    });

    it('persists device tokens for push registration', () => {
        expect(User.schema.path('pushTokens')).toBeDefined();
        expect(User.schema.path('pushTokens.token')).toBeDefined();
        expect(User.schema.path('pushTokens.platform')).toBeDefined();
    });
});
