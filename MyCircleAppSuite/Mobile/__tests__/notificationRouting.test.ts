import { getNotificationRoute, getNotificationTitle } from '../src/utils/notificationRouting';

describe('getNotificationRoute', () => {
    it('routes application_accepted to ChatWindow when a conversation is available', () => {
        expect(getNotificationRoute({
            event: 'application_accepted',
            type: 'approval',
            conversationId: 'conv-1',
        })).toEqual({ name: 'ChatWindow', params: { id: 'conv-1' } });
    });

    it('routes application_accepted to Requests without a conversation', () => {
        expect(getNotificationRoute({ event: 'application_accepted', type: 'approval' }))
            .toEqual({ name: 'Requests' });
    });

    it('routes application_rejected to Requests', () => {
        expect(getNotificationRoute({ event: 'application_rejected', type: 'info' }))
            .toEqual({ name: 'Requests' });
    });

    it('routes post_status_changed to PostDetails using postId or relatedId', () => {
        expect(getNotificationRoute({
            event: 'post_status_changed',
            postId: 'post-1',
            relatedId: 'related-1',
        })).toEqual({ name: 'PostDetails', params: { id: 'post-1' } });

        expect(getNotificationRoute({
            event: 'post_status_changed',
            relatedId: 'related-1',
        })).toEqual({ name: 'PostDetails', params: { id: 'related-1' } });
    });

    it('routes new_application and contact_request to Requests', () => {
        expect(getNotificationRoute({ event: 'new_application' })).toEqual({ name: 'Requests' });
        expect(getNotificationRoute({ event: 'contact_request' })).toEqual({ name: 'Requests' });
    });

    it('routes legacy approval notifications to ChatWindow or Requests', () => {
        expect(getNotificationRoute({ type: 'approval', conversationId: 'conv-2' }))
            .toEqual({ name: 'ChatWindow', params: { id: 'conv-2' } });
        expect(getNotificationRoute({ type: 'approval' })).toEqual({ name: 'Requests' });
    });

    it('routes legacy message notifications to ChatWindow or ChatList', () => {
        expect(getNotificationRoute({ type: 'message', conversationId: 'conv-3' }))
            .toEqual({ name: 'ChatWindow', params: { id: 'conv-3' } });
        expect(getNotificationRoute({ type: 'message' })).toEqual({ name: 'ChatList' });
    });

    it('routes legacy like and comment notifications to PostDetails', () => {
        expect(getNotificationRoute({ type: 'like', postId: 'post-2' }))
            .toEqual({ name: 'PostDetails', params: { id: 'post-2' } });
        expect(getNotificationRoute({ type: 'comment', relatedId: 'post-3' }))
            .toEqual({ name: 'PostDetails', params: { id: 'post-3' } });
    });

    it('falls back to link parsing', () => {
        expect(getNotificationRoute({ link: '/post/abc123?source=feed' }))
            .toEqual({ name: 'PostDetails', params: { id: 'abc123' } });
        expect(getNotificationRoute({ link: '/chat' })).toEqual({ name: 'ChatList' });
        expect(getNotificationRoute({ link: '/requests/' })).toEqual({ name: 'Requests' });
        expect(getNotificationRoute({ link: '/notifications' })).toEqual({ name: 'Notifications' });
    });

    it('returns null when no route can be determined', () => {
        expect(getNotificationRoute({ type: 'unknown', link: '/profile' })).toBeNull();
        expect(getNotificationRoute({})).toBeNull();
    });

    it('honours /my-posts links for info notifications', () => {
        expect(getNotificationRoute({ type: 'info', link: '/my-posts' })).toEqual({ name: 'MyPosts' });
    });

    it('honours post links from info notifications', () => {
        expect(getNotificationRoute({ type: 'info', link: '/post/post-7' })).toEqual({
            name: 'PostDetails',
            params: { id: 'post-7' },
        });
    });

    it('prefers a conversation id over a generic link', () => {
        expect(getNotificationRoute({
            type: 'approval',
            conversationId: 'conv-1',
            link: '/requests',
        })).toEqual({ name: 'ChatWindow', params: { id: 'conv-1' } });
    });

    it('routes message notifications with a conversation id to the chat', () => {
        expect(getNotificationRoute({
            type: 'message',
            event: 'message',
            relatedId: 'conv-2',
        })).toEqual({ name: 'ChatWindow', params: { id: 'conv-2' } });
    });

    it('falls back to Requests for generic notifications without a link', () => {
        expect(getNotificationRoute({ type: 'info' })).toEqual({ name: 'Requests' });
    });
});

describe('getNotificationTitle', () => {
    it('uses fixed titles for event notifications', () => {
        expect(getNotificationTitle({ event: 'application_accepted', title: 'Custom' })).toBe('Request Accepted');
        expect(getNotificationTitle({ event: 'application_rejected', title: 'Custom' })).toBe('Request Rejected');
        expect(getNotificationTitle({ event: 'new_application' })).toBe('New Application');
        expect(getNotificationTitle({ event: 'contact_request' })).toBe('New Contact Request');
    });

    it('uses the server title for post status changes with a sensible fallback', () => {
        expect(getNotificationTitle({ event: 'post_status_changed', title: 'Your post was approved' }))
            .toBe('Your post was approved');
        expect(getNotificationTitle({ event: 'post_status_changed' })).toBe('Post Status Updated');
    });

    it('supports legacy types and a generic fallback', () => {
        expect(getNotificationTitle({ type: 'approval' })).toBe('Request Approved');
        expect(getNotificationTitle({ type: 'like' })).toBe('New Like');
        expect(getNotificationTitle({ type: 'unknown' })).toBe('New Notification');
        expect(getNotificationTitle({ type: 'unknown', title: 'Server title' })).toBe('Server title');
    });
});
