import type { RootStackParamList } from '../navigation/types';

export interface NotificationPayload {
    _id?: string;
    type?: string;
    event?: string;
    title?: string;
    message?: string;
    link?: string;
    postId?: string;
    conversationId?: string;
    relatedId?: string;
    read?: boolean;
    createdAt?: string;
    [key: string]: any;
}

export type NotificationRoute = {
    name: keyof RootStackParamList;
    params?: any;
} | null;

const EVENT_TITLES: Record<string, string> = {
    application_accepted: 'Request Accepted',
    application_rejected: 'Request Rejected',
    post_status_changed: 'Post Status Updated',
    new_application: 'New Application',
    contact_request: 'New Contact Request',
};

const TYPE_TITLES: Record<string, string> = {
    request: 'New Request',
    request_received: 'New Request',
    request_approved: 'Request Approved',
    request_rejected: 'Request Rejected',
    approval: 'Request Approved',
    info: 'Update',
    system: 'Update',
    message: 'New Message',
    like: 'New Like',
    comment: 'New Comment',
};

const asString = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    return String(value);
};

const safeDecode = (value: string): string => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const routeFromLink = (link: string | null): NotificationRoute => {
    if (!link) return null;

    const withoutQuery = link.split(/[?#]/)[0];
    const pathname = withoutQuery.replace(/^https?:\/\/[^/]+/i, '').replace(/\/+$/, '') || '/';

    const postMatch = pathname.match(/^\/post\/([^/]+)$/);
    if (postMatch) {
        return { name: 'PostDetails', params: { id: safeDecode(postMatch[1]) } };
    }

    switch (pathname) {
        case '/chat':
            return { name: 'ChatList' };
        case '/requests':
            return { name: 'Requests' };
        case '/notifications':
            return { name: 'Notifications' };
        case '/my-posts':
            return { name: 'MyPosts' };
        default:
            return null;
    }
};

export const getNotificationRoute = (notification: NotificationPayload): NotificationRoute => {
    const event = asString(notification?.event);
    const type = asString(notification?.type);
    const conversationId = asString(notification?.conversationId);
    const postId = asString(notification?.postId);
    const relatedId = asString(notification?.relatedId);
    const linkRoute = routeFromLink(asString(notification?.link));

    switch (event) {
        case 'application_accepted':
            return conversationId
                ? { name: 'ChatWindow', params: { id: conversationId } }
                : { name: 'Requests' };
        case 'application_rejected':
            return { name: 'Requests' };
        case 'post_status_changed': {
            const id = postId || relatedId;
            if (id) return { name: 'PostDetails', params: { id } };
            break;
        }
        case 'new_application':
        case 'contact_request':
            return { name: 'Requests' };
    }

    // A conversation or post id is more specific than a generic link fallback.
    if ((type === 'message' || event === 'message') && (conversationId || relatedId)) {
        return { name: 'ChatWindow', params: { id: conversationId || relatedId } };
    }
    if ((type === 'approval' || type === 'request_approved') && conversationId) {
        return { name: 'ChatWindow', params: { id: conversationId } };
    }

    // Explicit links (including /my-posts) must not be swallowed by type fallbacks.
    if (linkRoute) return linkRoute;

    switch (type) {
        case 'approval':
        case 'request_approved':
            return { name: 'Requests' };
        case 'message':
            return { name: 'ChatList' };
        case 'like':
        case 'comment':
        case 'reply': {
            const id = postId || relatedId;
            if (id) return { name: 'PostDetails', params: { id } };
            break;
        }
        case 'request':
        case 'request_received':
        case 'request_rejected':
        case 'info':
            return { name: 'Requests' };
    }

    return null;
};

export const getNotificationTitle = (notification: NotificationPayload): string => {
    const event = asString(notification?.event);
    const type = asString(notification?.type);
    const serverTitle = asString(notification?.title);

    if (event && EVENT_TITLES[event]) {
        return event === 'post_status_changed'
            ? serverTitle || EVENT_TITLES[event]
            : EVENT_TITLES[event];
    }

    if (type && TYPE_TITLES[type]) {
        return serverTitle || TYPE_TITLES[type];
    }

    return serverTitle || 'New Notification';
};
