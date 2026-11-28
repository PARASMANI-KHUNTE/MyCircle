import {
    reconcileLikes,
    resolveShareLink,
    formatPostPrice,
    normalizePriceInput,
} from '../src/utils/postInteractions';

describe('post interactions', () => {
    it('reconciles likes from the server response after a rejection', () => {
        expect(reconcileLikes(['user-1'], 'user-2', { likes: 0, isLiked: false })).toEqual(['user-1']);
        expect(reconcileLikes(['user-1'], 'user-1', { likes: 0, isLiked: false })).toEqual([]);
        expect(reconcileLikes([], 'user-1', { likes: 1, isLiked: true })).toEqual(['user-1']);
    });

    it('keeps the previous state when the response is malformed', () => {
        expect(reconcileLikes(['user-1'], 'user-1', { likes: 1 })).toEqual(['user-1']);
        expect(reconcileLikes(['user-1'], undefined, { isLiked: true })).toEqual(['user-1']);
    });

    it('only accepts canonical share links for the requested post', () => {
        expect(resolveShareLink({ link: 'https://mycircle.app/post/post-1' }, 'post-1'))
            .toBe('https://mycircle.app/post/post-1');
        expect(resolveShareLink({ link: 'http://10.0.2.2:5000/post/post-1' }, 'post-1'))
            .toBe('http://10.0.2.2:5000/post/post-1');
        expect(resolveShareLink({ link: 'https://mycircle.app/post/other' }, 'post-1')).toBe(null);
        expect(resolveShareLink(null, 'post-1')).toBe(null);
    });

    it('does not render zero or blank prices as free listings', () => {
        expect(formatPostPrice({ price: 0, acceptsBarter: true })).toBe('Barter');
        expect(formatPostPrice({ price: '', acceptsBarter: false })).toBe('Contact');
        expect(formatPostPrice({ price: '1200' })).toBe('₹1,200');
    });

    it('omits invalid prices from form payloads', () => {
        expect(normalizePriceInput('')).toBe(undefined);
        expect(normalizePriceInput('0')).toBe(undefined);
        expect(normalizePriceInput('₹1,200')).toBe('1200');
    });
});
