import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getLocationPayload,
    getLocationSource,
    switchLocationMethod,
    validatePostDraft,
} from './postValidation.js';

const completeDraft = {
    type: 'job',
    jobType: 'plumbing',
    title: 'Need a plumber',
    description: 'Kitchen sink is leaking.',
    location: 'Connaught Place, New Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    price: '500',
    duration: 10080,
    exchangePreference: 'money',
};

test('accepts a complete web draft', () => {
    assert.equal(validatePostDraft('all', completeDraft), null);
});

test('requires a job type before leaving the category step', () => {
    const result = validatePostDraft('category', { ...completeDraft, jobType: '' });
    assert.equal(result?.field, 'jobType');
});

test('requires an item category for sell/rent posts', () => {
    const result = validatePostDraft('category', {
        ...completeDraft,
        type: 'sell',
        jobType: '',
        itemCategory: '',
    });
    assert.equal(result?.field, 'itemCategory');
});

test('requires coordinates and a location label', () => {
    assert.equal(validatePostDraft('location', { ...completeDraft, latitude: null })?.field, 'location');
    assert.equal(validatePostDraft('location', { ...completeDraft, location: '' })?.field, 'location');
});

test('rejects invalid prices', () => {
    assert.equal(validatePostDraft('exchange', { ...completeDraft, price: '-5' })?.field, 'price');
});

test('requires exactly one explicit location source for new drafts', () => {
    assert.equal(validatePostDraft('location', { ...completeDraft, locationSource: null })?.field, 'location');
    assert.equal(validatePostDraft('location', { ...completeDraft, locationSource: 'map' }), null);
});

test('maps options to a single source and clears data when switching', () => {
    assert.equal(getLocationSource('detect'), 'current');
    assert.equal(getLocationSource('pin'), 'map');
    assert.equal(getLocationSource(null), null);

    const switched = switchLocationMethod({
        method: 'detect',
        location: 'Old detected address',
        latitude: 28.6139,
        longitude: 77.209,
    }, 'pin');

    assert.deepEqual(switched, {
        method: 'pin',
        location: '',
        latitude: null,
        longitude: null,
    });
});

test('keeps captured data when the same option is selected again', () => {
    const selection = {
        method: 'detect',
        location: 'Connaught Place',
        latitude: 28.6139,
        longitude: 77.209,
    };

    assert.strictEqual(switchLocationMethod(selection, 'detect'), selection);
});

test('builds a payload with only one location source', () => {
    assert.deepEqual(getLocationPayload({
        method: 'pin',
        location: '  Connaught Place  ',
        latitude: 28.6139,
        longitude: 77.209,
    }), {
        location: 'Connaught Place',
        latitude: 28.6139,
        longitude: 77.209,
        locationSource: 'map',
    });

    assert.equal(getLocationPayload({
        method: null,
        location: 'Connaught Place',
        latitude: 28.6139,
        longitude: 77.209,
    }), null);
});
