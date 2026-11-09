const { FastKeywordTrie } = require('../src/utils/dsa/trie');
const { calculateHaversineDistance, formatDistance } = require('../src/utils/dsa/geo');
const { MinHeap, getTopK } = require('../src/utils/dsa/heap');
const { LRUCache } = require('../src/utils/dsa/lru');

describe('DSA & Optimized Algorithms Suite', () => {
    describe('Trie (FastKeywordTrie)', () => {
        const trie = new FastKeywordTrie(['badword', 'spam', 'chutiya']);

        it('detects banned words accurately in linear O(N) time', () => {
            expect(trie.containsMatch('This contains badword in text')).toBe(true);
            expect(trie.containsMatch('clean text without violations')).toBe(false);
            expect(trie.containsMatch('ye chutiya hai')).toBe(true);
        });

        it('respects word boundaries to avoid false positives', () => {
            const boundaryTrie = new FastKeywordTrie(['ass']);
            expect(boundaryTrie.containsMatch('pass')).toBe(false);
            expect(boundaryTrie.containsMatch('classic')).toBe(false);
            expect(boundaryTrie.containsMatch('you are an ass!')).toBe(true);
        });
    });

    describe('Geospatial Math (Haversine)', () => {
        it('calculates accurate distance between coordinates', () => {
            // New York [-74.0060, 40.7128] to Los Angeles [-118.2437, 34.0522]
            const distMeters = calculateHaversineDistance([-74.0060, 40.7128], [-118.2437, 34.0522]);
            const distKm = distMeters / 1000;
            // Approx 3935 km
            expect(distKm).toBeGreaterThan(3900);
            expect(distKm).toBeLessThan(4000);
        });

        it('formats metric distances into human readable displays', () => {
            expect(formatDistance(450)).toBe('450m away');
            expect(formatDistance(2500)).toBe('2.5km away');
            expect(formatDistance(null)).toBe(null);
        });
    });

    describe('Heap (MinHeap & Top-K)', () => {
        it('extracts top K items with optimal O(N log K) time', () => {
            const posts = [
                { id: '1', score: 10 },
                { id: '2', score: 50 },
                { id: '3', score: 25 },
                { id: '4', score: 90 },
                { id: '5', score: 70 },
            ];

            const top3 = getTopK(posts, 3, (p) => p.score);
            expect(top3.map((p) => p.id)).toEqual(['4', '5', '2']);
        });
    });

    describe('LRU Cache', () => {
        it('maintains bounded size and evicts least recently used items in O(1)', () => {
            const cache = new LRUCache(2);
            cache.put('a', 1);
            cache.put('b', 2);
            expect(cache.get('a')).toBe(1); // 'a' accessed, 'b' is now LRU

            cache.put('c', 3); // should evict 'b'
            expect(cache.get('b')).toBe(null);
            expect(cache.get('a')).toBe(1);
            expect(cache.get('c')).toBe(3);
        });
    });
});
