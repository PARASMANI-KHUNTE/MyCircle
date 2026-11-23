import { getCurrentUserId } from '../src/utils/userIdentity';

describe('getCurrentUserId', () => {
    it('prefers the MongoDB _id returned by /user/profile', () => {
        expect(getCurrentUserId({ _id: 'mongo-1', id: 'legacy-1' })).toBe('mongo-1');
    });

    it('falls back to id for legacy profile shapes', () => {
        expect(getCurrentUserId({ id: 'legacy-1' })).toBe('legacy-1');
    });

    it('stringifies non-string identifiers', () => {
        expect(getCurrentUserId({ _id: 123 })).toBe('123');
    });

    it('returns null when no identifier is available', () => {
        expect(getCurrentUserId(null)).toBeNull();
        expect(getCurrentUserId(undefined)).toBeNull();
        expect(getCurrentUserId({})).toBeNull();
    });
});
