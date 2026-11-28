export interface LikeState {
    likes: string[];
    isLiked: boolean;
}

/** Reconcile local like ids with the authoritative `{ likes, isLiked }` API response. */
export const reconcileLikes = (
    previousLikes: string[],
    userId: string | undefined,
    response: unknown,
    fallbackLikes: string[] = previousLikes
): string[] => {
    if (!userId || !response || typeof response !== 'object') return fallbackLikes;

    const payload = response as { isLiked?: unknown };
    if (typeof payload.isLiked !== 'boolean') return fallbackLikes;

    const withoutUser = previousLikes.filter((id) => id !== userId);
    return payload.isLiked ? [...withoutUser, userId] : withoutUser;
};

/** Resolve a canonical share link; never fall back to the API host or emulator URL. */
export const resolveShareLink = (response: unknown, postId: string): string | null => {
    if (!response || typeof response !== 'object') return null;
    const link = (response as { link?: unknown }).link;
    if (typeof link !== 'string' || !link.trim()) return null;

    const normalized = link.trim();
    return normalized.includes(`/post/${postId}`) ? normalized : null;
};

/** Blank, invalid and zero prices mean Barter/Contact instead of ₹0. */
export const formatPostPrice = (post: { price?: number | string | null; acceptsBarter?: boolean }): string => {
    const raw = post.price;
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        const numeric = Number(raw);
        if (Number.isFinite(numeric) && numeric > 0) {
            return `₹${numeric.toLocaleString('en-IN')}`;
        }
    }
    return post.acceptsBarter ? 'Barter' : 'Contact';
};

/** Form price for FormData; omit invalid/blank values so the server keeps its default. */
export const normalizePriceInput = (value: string): string | undefined => {
    const cleaned = String(value || '').replace(/[^0-9.]/g, '');
    if (!cleaned) return undefined;
    const numeric = Number(cleaned);
    if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
    return String(numeric);
};
