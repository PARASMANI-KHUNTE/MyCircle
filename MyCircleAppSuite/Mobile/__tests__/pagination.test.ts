import { getPageMeta } from '../src/utils/pagination';

describe('getPageMeta', () => {
    it('reads lower-cased axios headers', () => {
        expect(getPageMeta({ 'x-has-more': 'true', 'x-total-count': '120' }, 20, 20))
            .toEqual({ hasMore: true, total: 120 });
    });

    it('supports AxiosHeaders.get and boolean values', () => {
        const headers = {
            get: (name: string) => (name === 'x-has-more' ? false : 42),
        };
        expect(getPageMeta(headers, 5, 20)).toEqual({ hasMore: false, total: 42 });
    });

    it('falls back to a full page when the header is missing', () => {
        expect(getPageMeta(undefined, 25, 25).hasMore).toBe(true);
        expect(getPageMeta({}, 10, 25).hasMore).toBe(false);
    });

    it('ignores a non-numeric total', () => {
        expect(getPageMeta({ 'x-total-count': 'unknown' }, 1, 20).total).toBeUndefined();
    });
});
