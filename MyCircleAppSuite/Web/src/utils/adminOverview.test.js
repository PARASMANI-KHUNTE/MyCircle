import test from 'node:test';
import assert from 'node:assert/strict';
import { getOverviewCards } from './adminOverview.js';

test('maps every admin overview KPI to a card', () => {
    const cards = getOverviewCards({
        users: 120,
        posts: 45,
        deals: 7,
        openReports: 3,
        openSubmissions: 2,
        suspendedUsers: 1,
    });

    assert.equal(cards.length, 6);
    assert.deepEqual(cards.map((card) => card.key), [
        'users',
        'posts',
        'deals',
        'openReports',
        'openSubmissions',
        'suspendedUsers',
    ]);
    assert.deepEqual(cards.map((card) => card.value), [120, 45, 7, 3, 2, 1]);
});

test('falls back to zero for missing or invalid KPI values', () => {
    const cards = getOverviewCards({ users: undefined, posts: null, deals: 'not-a-number' });

    assert.deepEqual(cards.map((card) => card.value), [0, 0, 0, 0, 0, 0]);
});
