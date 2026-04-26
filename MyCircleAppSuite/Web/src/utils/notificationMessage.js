const GENERIC_TITLES = new Set([
    'new message',
    'new like',
    'new contact request',
    'new comment',
    'new reply',
    'request accepted',
    'request rejected',
    'request canceled',
    'work marked complete',
    'notification',
]);

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

const isGenericTitle = (title) => {
    const normalized = normalize(title).toLowerCase();
    return normalized.length === 0 || GENERIC_TITLES.has(normalized);
};

const getSenderName = (notification) => {
    const senderName = normalize(notification?.sender?.displayName);
    return senderName || 'Someone';
};

const buildFallbackMessage = (notification) => {
    const senderName = getSenderName(notification);
    const type = normalize(notification?.type).toLowerCase();

    if (type === 'message') {
        return {
            title: 'New message',
            message: `${senderName} sent you a new message.`
        };
    }

    if (type === 'like') {
        return {
            title: 'Post liked',
            message: `${senderName} liked your post.`
        };
    }

    if (type === 'comment') {
        return {
            title: 'New comment',
            message: `${senderName} commented on your post.`
        };
    }

    if (type === 'request') {
        return {
            title: 'Contact request',
            message: `${senderName} sent you a contact request.`
        };
    }

    if (type === 'approval') {
        return {
            title: 'Request update',
            message: `${senderName} approved your request.`
        };
    }

    if (type === 'info') {
        return {
            title: 'Update',
            message: `${senderName} sent you an update.`
        };
    }

    return {
        title: 'Notification',
        message: `${senderName} sent you a notification.`
    };
};

export const getNotificationCopy = (notification) => {
    const fallback = buildFallbackMessage(notification);
    const title = normalize(notification?.title);
    const message = normalize(notification?.message);

    return {
        title: isGenericTitle(title) ? fallback.title : title,
        message: message || fallback.message,
    };
};

export const getToastMessageFromNotification = (notification) => {
    const { title, message } = getNotificationCopy(notification);

    if (!title) return message;
    if (!message) return title;

    const normalizedTitle = title.toLowerCase();
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.startsWith(normalizedTitle)) {
        return message;
    }

    return `${title}: ${message}`;
};
