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

    it('rejects an empty settings payload', () => {
        const result = schemas.updateUserSettings.safeParse({});

        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe('At least one setting is required');
    });
});
