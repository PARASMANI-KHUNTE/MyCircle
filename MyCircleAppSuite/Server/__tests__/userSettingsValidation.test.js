const { schemas } = require('../src/middleware/validation');

describe('updateUserSettings schema', () => {
    it('accepts a boolean notification preference', () => {
        expect(schemas.updateUserSettings.safeParse({ emailNotifications: false }).success).toBe(true);
    });

    it('accepts a supported profile visibility', () => {
        expect(schemas.updateUserSettings.safeParse({ profileVisibility: 'private' }).success).toBe(true);
    });

    it('rejects non-boolean notification values', () => {
        const result = schemas.updateUserSettings.safeParse({ emailNotifications: 'yes' });

        expect(result.success).toBe(false);
        expect(result.error.issues[0].path).toEqual(['emailNotifications']);
    });

    it('rejects unsupported profile visibility values', () => {
        const result = schemas.updateUserSettings.safeParse({ profileVisibility: 'friends' });

        expect(result.success).toBe(false);
        expect(result.error.issues[0].path).toEqual(['profileVisibility']);
    });

    it('accepts granular notification categories and quiet hours', () => {
        const result = schemas.updateUserSettings.safeParse({
            notificationCategories: { messages: false, postExpiry: true },
            quietHours: { enabled: true, start: '22:00', end: '07:00', timezone: 'Asia/Kolkata' },
        });

        expect(result.success).toBe(true);
    });

    it('rejects malformed quiet hours and oversized presets', () => {
        expect(schemas.updateUserSettings.safeParse({
            quietHours: { start: '25:00' },
        }).success).toBe(false);
        expect(schemas.updateUserSettings.safeParse({
            feedPresets: Array.from({ length: 21 }, (_, index) => ({ name: `Preset ${index}` })),
        }).success).toBe(false);
    });

    it('accepts saved feed presets', () => {
        const result = schemas.updateUserSettings.safeParse({
            feedPresets: [{
                name: 'Nearby barter',
                type: 'barter',
                radius: 10,
                barterOnly: true,
                urgentOnly: false,
                location: 'Connaught Place',
            }],
        });

        expect(result.success).toBe(true);
    });

    it('rejects an empty settings payload', () => {
        const result = schemas.updateUserSettings.safeParse({});

        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe('At least one setting is required');
    });
});
