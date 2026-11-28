const CATEGORY_BY_EVENT = {
    contact_request: 'contactRequests',
    new_application: 'contactRequests',
    application_accepted: 'contactRequests',
    application_rejected: 'contactRequests',
    location_shared: 'contactRequests',
    location_share_revoked: 'contactRequests',
    message: 'messages',
    post_expiring: 'postExpiry',
    post_expired: 'postExpiry',
    request_expired: 'postExpiry',
    post_archived: 'postExpiry',
};

const CATEGORY_BY_TYPE = {
    request: 'contactRequests',
    approval: 'contactRequests',
    message: 'messages',
};

/** Resolve which granular toggle controls a notification. */
const getNotificationCategory = ({ event, type, title } = {}) => {
    if (CATEGORY_BY_EVENT[event]) return CATEGORY_BY_EVENT[event];
    if (CATEGORY_BY_TYPE[type]) return CATEGORY_BY_TYPE[type];
    if (/expir|archiv/i.test(String(title || ''))) return 'postExpiry';
    return null;
};

const parseClockTime = (value) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || ''));
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
};

const minutesAtTimezone = (date, timeZone) => {
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone || 'UTC',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(date);
        const hour = Number(parts.find((part) => part.type === 'hour')?.value);
        const minute = Number(parts.find((part) => part.type === 'minute')?.value);
        if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
        return (hour % 24) * 60 + minute;
    } catch (err) {
        return null;
    }
};

/** True when the current local time falls inside the configured quiet window. */
const isWithinQuietHours = (quietHours, now = new Date()) => {
    if (!quietHours || quietHours.enabled !== true) return false;

    const start = parseClockTime(quietHours.start);
    const end = parseClockTime(quietHours.end);
    if (start === null || end === null || start === end) return false;

    const current = minutesAtTimezone(now, quietHours.timezone);
    if (current === null) return false;

    // Overnight windows (e.g. 22:00 -> 07:00) wrap past midnight.
    if (start > end) return current >= start || current < end;
    return current >= start && current < end;
};

/**
 * Look up the recipient's granular preferences and decide whether to deliver.
 * Missing preferences or a failed lookup fail open so notifications are not lost.
 */
const shouldDeliverNotification = async (UserModel, recipientId, payload, now = new Date()) => {
    let preferences = {};

    try {
        const user = await UserModel.findById(recipientId).select('preferences').lean();
        preferences = user?.preferences || {};
    } catch (err) {
        return true;
    }

    const category = getNotificationCategory(payload);
    if (category && preferences.notificationCategories?.[category] === false) return false;
    if (isWithinQuietHours(preferences.quietHours, now)) return false;

    return true;
};

module.exports = {
    getNotificationCategory,
    isWithinQuietHours,
    shouldDeliverNotification,
};
