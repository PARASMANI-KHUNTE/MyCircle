import test from 'node:test';
import assert from 'node:assert/strict';
import { getNotificationDestination, mergeNotification } from './notificationRouting.js';

test('application_accepted opens the conversation when one exists', () => {
    assert.equal(
        getNotificationDestination({ event: 'application_accepted', conversationId: 'conv-42' }),
        '/chat?conversationId=conv-42'
    );
});

test('application_accepted without a conversation falls back to requests', () => {
    assert.equal(getNotificationDestination({ event: 'application_accepted' }), '/requests');
    assert.equal(
        getNotificationDestination({ event: 'application_accepted', conversationId: '' }),
        '/requests'
    );
});

test('application_rejected, new_application and contact_request go to requests', () => {
    assert.equal(getNotificationDestination({ event: 'application_rejected' }), '/requests');
    assert.equal(getNotificationDestination({ event: 'new_application' }), '/requests');
    assert.equal(getNotificationDestination({ event: 'contact_request', type: 'request' }), '/requests');
});

test('post_status_changed uses postId then relatedId', () => {
    assert.equal(
        getNotificationDestination({ event: 'post_status_changed', postId: 'post-1', relatedId: 'post-2' }),
        '/post/post-1'
    );
    assert.equal(
        getNotificationDestination({ event: 'post_status_changed', relatedId: 'post-2' }),
        '/post/post-2'
    );
    assert.equal(getNotificationDestination({ event: 'post_status_changed' }), '/notifications');
});

test('message notifications open chat, using the conversation when present', () => {
    assert.equal(getNotificationDestination({ type: 'message' }), '/chat');
    assert.equal(
        getNotificationDestination({ type: 'message', conversationId: 'conv-7' }),
        '/chat?conversationId=conv-7'
    );
});

test('like and comment notifications open the related post', () => {
    assert.equal(getNotificationDestination({ type: 'like', relatedId: 'p1' }), '/post/p1');
    assert.equal(getNotificationDestination({ type: 'like', postId: 'p2' }), '/post/p2');
    assert.equal(getNotificationDestination({ type: 'comment', relatedId: 'p3' }), '/post/p3#comments');
    assert.equal(getNotificationDestination({ type: 'reply', relatedId: 'p4' }), '/post/p4#comments');
});

test('event rules take precedence over legacy types', () => {
    assert.equal(
        getNotificationDestination({ event: 'application_rejected', type: 'like', relatedId: 'p1' }),
        '/requests'
    );
    assert.equal(
        getNotificationDestination({ event: 'post_status_changed', type: 'message', postId: 'p2' }),
        '/post/p2'
    );
});

test('legacy request-style notifications keep their destinations', () => {
    assert.equal(getNotificationDestination({ type: 'request', relatedId: 'p1' }), '/requests');
    assert.equal(getNotificationDestination({ type: 'info', relatedId: 'p2' }), '/requests');
    assert.equal(
        getNotificationDestination({ type: 'approval', conversationId: 'conv-1' }),
        '/chat?conversationId=conv-1'
    );
});

test('falls back to a safe internal link, otherwise to /notifications', () => {
    assert.equal(getNotificationDestination({ type: 'system', link: '/post/9#comments' }), '/post/9#comments');
    assert.equal(getNotificationDestination({ type: 'system', link: '  /requests?tab=all  ' }), '/requests?tab=all');
    assert.equal(getNotificationDestination({ type: 'system', link: '//evil.example.com' }), '/notifications');
    assert.equal(getNotificationDestination({ type: 'system', link: '/\\evil.example.com' }), '/notifications');
    assert.equal(getNotificationDestination({ type: 'system', link: 'https://evil.example.com' }), '/notifications');
    assert.equal(getNotificationDestination({ type: 'system', link: 'javascript:alert(1)' }), '/notifications');
    assert.equal(getNotificationDestination({ type: 'system' }), '/notifications');
    assert.equal(getNotificationDestination(null), '/notifications');
});

test('mergeNotification puts the incoming item first and drops duplicates', () => {
    const existing = [
        { _id: 'a', read: true },
        { _id: 'b', read: true },
    ];
    const incoming = { _id: 'c', read: false };
    const result = mergeNotification(existing, incoming);

    assert.deepEqual(result.notifications.map((item) => item._id), ['c', 'a', 'b']);
    assert.equal(result.notifications[0], incoming);
    assert.notEqual(result.notifications, existing);
    assert.deepEqual(existing.map((item) => item._id), ['a', 'b']);
});

test('mergeNotification removes every stale copy of the same id', () => {
    const result = mergeNotification(
        [{ _id: 'a', read: true }, { _id: 'b' }, { _id: 'a', read: true }],
        { _id: 'a', read: false, message: 'fresh' }
    );

    assert.deepEqual(result.notifications.map((item) => item._id), ['a', 'b']);
    assert.equal(result.notifications[0].message, 'fresh');
    assert.equal(result.becameUnread, true);
});

test('becameUnread is false when an unread copy already exists', () => {
    const result = mergeNotification(
        [{ _id: 'a', read: false }, { _id: 'b', read: true }],
        { _id: 'a', read: false, message: 'updated copy' }
    );

    assert.equal(result.becameUnread, false);
    assert.equal(result.notifications.length, 2);
    assert.equal(result.notifications[0].message, 'updated copy');
});

test('becameUnread is false for read incoming notifications', () => {
    const result = mergeNotification([{ _id: 'a', read: true }], { _id: 'a', read: true });
    assert.equal(result.becameUnread, false);
});

test('unrelated unread notifications do not suppress becameUnread', () => {
    const result = mergeNotification(
        [{ _id: 'other', read: false }],
        { _id: 'new', read: false }
    );

    assert.equal(result.becameUnread, true);
    assert.deepEqual(result.notifications.map((item) => item._id), ['new', 'other']);
});

test('mergeNotification handles empty or missing inputs without mutating them', () => {
    assert.deepEqual(mergeNotification(null, null), { notifications: [], becameUnread: false });

    const list = [{ _id: 'a', read: true }];
    const result = mergeNotification(list, undefined);
    assert.deepEqual(result, { notifications: [{ _id: 'a', read: true }], becameUnread: false });
    assert.notEqual(result.notifications, list);

    const noId = mergeNotification(list, { read: false });
    assert.equal(noId.notifications.length, 2);
    assert.equal(noId.becameUnread, true);
});
