import {
    buildContactPhone,
    formatRating,
    normalizeContactPhone,
    normalizeProfileStats,
    parseContactPhone,
    resolveAvatarUri,
} from '../src/utils/profileData';

describe('profile data', () => {
    it('uses own stats response counts and suppresses unrated ratings', () => {
        const stats = normalizeProfileStats(
            { rating: 5, reviews: 0 },
            { stats: { totalPosts: 7, receivedRequests: 3 }, rating: 0, reviews: 0 }
        );

        expect(stats).toEqual({ posts: 7, requests: 3, rating: null, reviews: 0 });
        expect(formatRating(stats)).toBe('No rating yet');
    });

    it('uses public profile stats without inventing request counts', () => {
        const stats = normalizeProfileStats({ stats: { totalPosts: 4 }, rating: 4.5, reviews: 2 });

        expect(stats).toEqual({ posts: 4, requests: null, rating: 4.5, reviews: 2 });
        expect(formatRating(stats)).toBe('4.5');
    });

    it('normalizes one canonical contact phone', () => {
        expect(normalizeContactPhone(' +91 98765 43210 ')).toBe('+919876543210');
        expect(normalizeContactPhone('')).toBe('');
        expect(parseContactPhone('+1 415 555 0100')).toEqual({
            countryCode: '+1',
            number: '4155550100',
        });
        expect(buildContactPhone('+91', '98765 43210')).toBe('+919876543210');
    });

    it('resolves the fetched avatar before auth and generated fallbacks', () => {
        expect(resolveAvatarUri('https://cdn/a.png', 'https://cdn/b.png', 'Ada')).toBe('https://cdn/a.png');
        expect(resolveAvatarUri(null, 'https://cdn/b.png', 'Ada')).toBe('https://cdn/b.png');
        expect(resolveAvatarUri(null, null, 'Ada Lovelace')).toContain('seed=Ada%20Lovelace');
    });
});
