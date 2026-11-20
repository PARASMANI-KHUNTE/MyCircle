import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePostDraft } from './postValidation.js';

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
