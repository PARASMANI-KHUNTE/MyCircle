import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSubmissionPayload, SUBMISSION_STATUSES, SUBMISSION_TYPES } from './support.js';

test('submission types and statuses match the API enums', () => {
    assert.deepEqual(SUBMISSION_TYPES, ['report', 'help', 'feedback']);
    assert.deepEqual(SUBMISSION_STATUSES, ['open', 'in_progress', 'resolved', 'dismissed']);
});

test('help payload contains only type and trimmed message', () => {
    assert.deepEqual(buildSubmissionPayload({ type: 'help', message: '  Need help  ' }), {
        type: 'help',
        message: 'Need help',
    });
});

test('report payload includes report-specific fields', () => {
    const payload = buildSubmissionPayload({
        type: 'report',
        message: 'Spam account',
        category: 'spam',
        subjectType: 'user',
        reportedUserId: 'user-2',
        subjectId: 'not-a-report-field',
    });

    assert.equal(payload.type, 'report');
    assert.equal(payload.category, 'spam');
    assert.equal(payload.subjectType, 'user');
    assert.equal(payload.reportedUserId, 'user-2');
});

test('help payload ignores report-only fields', () => {
    const payload = buildSubmissionPayload({ type: 'feedback', message: 'Great app', reportedUserId: 'user-2' });

    assert.equal(payload.reportedUserId, undefined);
});
