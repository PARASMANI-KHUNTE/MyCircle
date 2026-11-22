import { isAdminUser } from '../src/utils/adminAccess';

describe('isAdminUser', () => {
    it('allows only the admin role', () => {
        expect(isAdminUser({ role: 'admin' })).toBe(true);
        expect(isAdminUser({ role: 'moderator' })).toBe(false);
        expect(isAdminUser({ role: 'user' })).toBe(false);
    });

    it('denies missing users', () => {
        expect(isAdminUser(null)).toBe(false);
        expect(isAdminUser(undefined)).toBe(false);
        expect(isAdminUser({})).toBe(false);
    });
});
