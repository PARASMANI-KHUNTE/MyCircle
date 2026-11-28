import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_FEED_FILTERS,
    normalizeFeedFilters,
    buildFeedParams,
    describeFeedPreset,
} from './feedPresets.js';

test('normalizes saved filters and clamps radius', () => {
    assert.deepEqual(normalizeFeedFilters({ type: 'barter', radius: 999, barterOnly: true }), {
        type: 'barter',
        radius: 500,
        barterOnly: true,
        urgentOnly: false,
        location: '',
    });
    assert.deepEqual(normalizeFeedFilters(), DEFAULT_FEED_FILTERS);
});

test('builds feed API params with hyperlocal filters when coordinates exist', () => {
    const params = buildFeedParams(
        { type: 'hire', radius: 12, barterOnly: true, urgentOnly: true, location: 'Noida' },
        { query: '  plumber  ', sort: 'oldest', coords: { lat: 28.6, lng: 77.2 } }
    );

    assert.equal(params.type, 'hire');
    assert.equal(params.q, 'plumber');
    assert.equal(params.sort, 'oldest');
    assert.equal(params.location, 'Noida');
    assert.equal(params.latitude, 28.6);
    assert.equal(params.longitude, 77.2);
    assert.equal(params.radius, 12);
    assert.equal(params.barterOnly, true);
    assert.equal(params.urgentOnly, true);
});

test('omits geo params until the user shares a location', () => {
    const params = buildFeedParams({ radius: 25 }, { coords: null });

    assert.equal(params.latitude, undefined);
    assert.equal(params.longitude, undefined);
    assert.equal(params.radius, undefined);
});

test('describes a preset for the settings list', () => {
    const description = describeFeedPreset({
        name: 'Nearby barter',
        type: 'barter',
        radius: 10,
        barterOnly: true,
        location: 'Connaught Place',
    });

    assert.equal(description, 'barter · Connaught Place · within 10 km · barter only');
});
