export interface ChatParticipant {
    _id?: any;
    id?: any;
    displayName?: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeenAt?: string | Date | null;
}

export type PresenceOverrides = Record<string, boolean>;

export const getParticipantId = (participant?: ChatParticipant | null): string | null => {
    const id = participant?._id ?? participant?.id;
    if (id === undefined || id === null || id === '') return null;
    return String(id);
};

/**
 * Pick the chat recipient only after the authenticated user is known.
 * Never fall back to participants[0], which can be the current user.
 */
export const resolveOtherParticipant = (
    participants: ChatParticipant[] | undefined | null,
    currentUserId: string | null | undefined,
    fallback?: ChatParticipant | null
): ChatParticipant | null => {
    const currentId = currentUserId ? String(currentUserId) : null;
    if (!currentId) return null;

    const other = (participants || []).find(
        (participant) => getParticipantId(participant) !== currentId
    );
    if (other) return other;

    const fallbackId = getParticipantId(fallback);
    if (fallbackId && fallbackId !== currentId) return fallback || null;
    return null;
};

/** Live socket events override the presence snapshot returned with the conversation. */
export const resolvePresenceOverride = (
    participant: ChatParticipant | null | undefined,
    overrides: PresenceOverrides
): boolean => {
    const id = getParticipantId(participant);
    if (!id) return false;
    return Object.prototype.hasOwnProperty.call(overrides, id)
        ? Boolean(overrides[id])
        : Boolean(participant?.isOnline);
};

export const formatPresenceStatus = (isOnline: boolean): string =>
    isOnline ? 'Online' : 'Offline';
