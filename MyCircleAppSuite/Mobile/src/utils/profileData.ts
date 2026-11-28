export interface ProfileViewStats {
    posts: number;
    requests: number | null;
    rating: number | null;
    reviews: number;
}

const toCount = (value: unknown): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
};

/** Normalize own/public profile responses into one display shape. */
export const normalizeProfileStats = (
    profile: any,
    statsResponse?: any
): ProfileViewStats => {
    const source = statsResponse?.stats || profile?.stats || {};
    const reviews = toCount(statsResponse?.reviews ?? profile?.reviews ?? profile?.reputation?.reviewsCount);
    const rawRating = Number(statsResponse?.rating ?? profile?.rating ?? 0);
    const rating = reviews > 0 && Number.isFinite(rawRating) && rawRating > 0
        ? rawRating
        : null;

    return {
        posts: toCount(source.totalPosts ?? profile?.postsCount),
        requests: source.receivedRequests !== undefined
            ? toCount(source.receivedRequests)
            : (profile?.requestsCount !== undefined ? toCount(profile.requestsCount) : null),
        rating,
        reviews,
    };
};

export const formatRating = (stats: ProfileViewStats): string =>
    stats.rating !== null ? stats.rating.toFixed(1) : 'No rating yet';

/** Keep only one canonical contactPhone value, with no duplicate country codes. */
export const normalizeContactPhone = (value: string): string => {
    const cleaned = String(value || '').trim();
    if (!cleaned) return '';
    const hasPlus = cleaned.startsWith('+');
    const digits = cleaned.replace(/\D/g, '');
    if (!digits) return '';
    return `${hasPlus ? '+' : ''}${digits}`;
};

export const resolveAvatarUri = (
    profileAvatar?: string | null,
    authAvatar?: string | null,
    displayName?: string | null
): string => {
    if (profileAvatar) return profileAvatar;
    if (authAvatar) return authAvatar;
    const seed = encodeURIComponent(displayName || 'user');
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}`;
};

export interface ContactPhoneParts {
    countryCode: string;
    number: string;
}

// Longer codes must be checked first so +91 wins over +9 and +1 over an unmatched prefix.
const COUNTRY_CODES = [
    '+971', '+880', '+966', '+234', '+353', '+358', '+852', '+886',
    '+49', '+33', '+44', '+61', '+62', '+63', '+65', '+81', '+82',
    '+86', '+90', '+91', '+92', '+20', '+27', '+34', '+39', '+55', '+7', '+1',
].sort((a, b) => b.length - a.length);

/** Split a stored contactPhone for the edit form without inventing duplicates. */
export const parseContactPhone = (
    value: string,
    fallbackCountryCode: string = '+91'
): ContactPhoneParts => {
    const cleaned = normalizeContactPhone(value);
    if (!cleaned) return { countryCode: fallbackCountryCode, number: '' };

    if (cleaned.startsWith('+')) {
        const code = COUNTRY_CODES.find(
            (candidate) => cleaned.startsWith(candidate) && cleaned.length > candidate.length
        );
        if (code) return { countryCode: code, number: cleaned.slice(code.length) };
        return { countryCode: cleaned, number: '' };
    }

    return { countryCode: fallbackCountryCode, number: cleaned };
};

export const buildContactPhone = (countryCode: string, number: string): string =>
    normalizeContactPhone(`${countryCode || '+91'}${number}`);
