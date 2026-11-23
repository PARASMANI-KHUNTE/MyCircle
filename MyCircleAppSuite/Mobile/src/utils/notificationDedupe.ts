import type { NotificationPayload } from './notificationRouting';

const DISPLAY_WINDOW_MS = 60_000;
const MAX_TRACKED_DISPLAYS = 200;

const displayedAt = new Map<string, number>();
const openedIds = new Set<string>();

const displayKeyFor = (payload: Partial<NotificationPayload> & Record<string, any>): string => {
    const id = payload._id || payload.notificationId;
    if (id) return `id:${String(id)}`;

    return [
        'content',
        payload.type,
        payload.event,
        payload.link,
        payload.relatedId,
        payload.postId,
        payload.conversationId,
        payload.title,
        payload.message,
    ].join('|');
};

/** Returns true only when this event should still be shown to the user. */
export const claimForegroundDisplay = (
    payload: Partial<NotificationPayload> & Record<string, any>,
    now: number = Date.now()
): boolean => {
    const key = displayKeyFor(payload);
    const previous = displayedAt.get(key);
    if (previous !== undefined && now - previous < DISPLAY_WINDOW_MS) {
        return false;
    }

    displayedAt.set(key, now);
    if (displayedAt.size > MAX_TRACKED_DISPLAYS) {
        const cutoff = now - DISPLAY_WINDOW_MS;
        displayedAt.forEach((timestamp, trackedKey) => {
            if (timestamp < cutoff) displayedAt.delete(trackedKey);
        });
    }
    return true;
};

/** Returns true only when this notification has not already handled a tap. */
export const claimNotificationOpen = (id?: string | null): boolean => {
    if (!id) return true;
    const key = String(id);
    if (openedIds.has(key)) return false;
    openedIds.add(key);
    return true;
};

export const resetNotificationDedupe = () => {
    displayedAt.clear();
    openedIds.clear();
};
