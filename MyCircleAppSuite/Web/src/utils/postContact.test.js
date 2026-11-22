import test from 'node:test';
import assert from 'node:assert/strict';
import { getCallNumber, getTextNumber } from './postContact.js';

test('uses the top-level contact fields returned by the post API', () => {
    const post = { contactPhone: '+111', contactWhatsapp: '+222', user: { displayName: 'Owner' } };

    assert.equal(getCallNumber(post), '+111');
    assert.equal(getTextNumber(post), '+222');
});

test('falls back to the populated user fields when present', () => {
    const post = { user: { contactPhone: '+333', contactWhatsapp: '+444' } };

    assert.equal(getCallNumber(post), '+333');
    assert.equal(getTextNumber(post), '+444');
});

test('prefers the other number when the preferred one is missing', () => {
    assert.equal(getCallNumber({ contactWhatsapp: '+555' }), '+555');
    assert.equal(getTextNumber({ contactPhone: '+666' }), '+666');
});

test('returns null when no contact number is available', () => {
    assert.equal(getCallNumber({ user: {} }), null);
    assert.equal(getTextNumber({ user: {} }), null);
});
