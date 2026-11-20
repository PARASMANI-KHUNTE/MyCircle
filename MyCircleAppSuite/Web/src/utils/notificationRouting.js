const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

const getEvent = (notification) => normalize(notification?.event).toLowerCase();
const getType = (notification) => normalize(notification?.type).toLowerCase();

const getPostId = (notification) => (
    normalize(notification?.postId) || normalize(notification?.relatedId)
);

const getChatDestination = (conversationId) => (
    conversationId
        ? `/chat?conversationId=${encodeURIComponent(conversationId)}`
        : '/chat'
);

const getPostPath = (notification) => {
    const postId = getPostId(notification);
    return postId ? `/post/${encodeURIComponent(postId)}` : '';
};

// Only allow same-origin, absolute paths. Reject protocol-relative links,
// backslash variants, schemes and control characters so a server-provided
// link can never turn into an external or javascript: navigation.
const isSafeInternalPath = (link) => {
    const path = normalize(link);
    if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
        return false;
    }
    for (let index = 0; index < path.length; index += 1) {
        const code = path.charCodeAt(index);
        if (code < 32 || code === 127) {
            return false;
        }
    }

    try {
        const url = new URL(path, 'http://mycircle.internal');
        if (url.origin !== 'http://mycircle.internal' || !url.pathname.startsWith('/')) {
            return false;
        }

        let decodedPath = url.pathname;
        try {
            decodedPath = decodeURIComponent(url.pathname);
        } catch {
            // Keep the raw pathname if it contains a stray percent sign.
        }

        return !decodedPath.startsWith('//') && !decodedPath.startsWith('/\\');
    } catch {
        return false;
    }
};

export const getNotificationDestination = (notification) => {
    if (!notification || typeof notification !== 'object') {
        return '/notifications';
    }

    const event = getEvent(notification);
    const type = getType(notification);
    const postPath = getPostPath(notification);

    if (event === 'application_accepted') {
        const conversationId = normalize(notification.conversationId);
        return conversationId ? getChatDestination(conversationId) : '/requests';
    }

    if (event === 'application_rejected' || event === 'new_application' || event === 'contact_request') {
        return '/requests';
    }

    if (event === 'post_status_changed' && postPath) {
        return postPath;
    }

    if (type === 'message') {
        return getChatDestination(normalize(notification.conversationId));
    }

    if (type === 'like' && postPath) {
        return postPath;
    }

    if ((type === 'comment' || type === 'reply') && postPath) {
        return `${postPath}#comments`;
    }

    // Legacy request-style notifications keep their previous destinations.
    if (['request', 'approval', 'info'].includes(type)) {
        if (type === 'approval' && normalize(notification.conversationId)) {
            return getChatDestination(normalize(notification.conversationId));
        }
        if (getPostId(notification)) {
            return '/requests';
        }
    }

    const link = normalize(notification.link);
    return isSafeInternalPath(link) ? link : '/notifications';
};

export const mergeNotification = (list, incoming) => {
    const current = Array.isArray(list) ? list : [];

    if (!incoming || typeof incoming !== 'object') {
        return { notifications: [...current], becameUnread: false };
    }

    const incomingId = incoming._id;
    const hasId = incomingId !== undefined && incomingId !== null;
    const isSameNotification = (item) => hasId && item?._id === incomingId;
    const existing = hasId ? current.find(isSameNotification) : undefined;

    return {
        notifications: [incoming, ...current.filter((item) => !isSameNotification(item))],
        becameUnread: !incoming.read && !(existing && !existing.read),
    };
};
