import { getSocketBaseUrl } from './api';

/**
 * Generate a colorful, unique avatar based on user's name
 * Uses a deterministic algorithm to create consistent avatars
 */
export function generateAvatar(name, size = 128) {
    const safeName = typeof name === 'string' && name.trim() ? name.trim() : 'User';

    // Create a hash from the name for consistent colors
    const hash = safeName.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Generate colors from hash
    const hue = Math.abs(hash % 360);
    const saturation = 65 + (Math.abs(hash) % 20);
    const lightness = 50 + (Math.abs(hash) % 15);

    const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const textColor = lightness > 60 ? '#1a1a1a' : '#ffffff';

    // Get initials (max 2 characters)
    const initials = safeName
        .split(' ')
        .map(word => word[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Create SVG
    const svg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <text
                x="50%"
                y="50%"
                dominant-baseline="middle"
                text-anchor="middle"
                font-family="system-ui, -apple-system, sans-serif"
                font-size="${size * 0.4}"
                font-weight="600"
                fill="${textColor}"
            >${initials}</text>
        </svg>
    `;

    // Convert to Unicode-safe inline SVG data URL
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const toAbsoluteAvatarUrl = (avatarPath) => {
    if (typeof avatarPath !== 'string') return '';

    const normalizedPath = avatarPath.trim().replace(/\\/g, '/');
    if (!normalizedPath) return '';

    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
        return normalizedPath;
    }

    if (normalizedPath.startsWith('//')) {
        return `https:${normalizedPath}`;
    }

    const baseUrl = getSocketBaseUrl() || '';
    if (!baseUrl) return normalizedPath;

    const safeBaseUrl = baseUrl.replace(/\/$/, '');
    const safePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${safeBaseUrl}${safePath}`;
};

/**
 * Get avatar URL - returns user's avatar or generates one using Dicebear
 */
export function getAvatarUrl(user) {
    if (user && typeof user === 'object' && user.avatar && typeof user.avatar === 'string' && user.avatar.length > 0) {
        return toAbsoluteAvatarUrl(user.avatar);
    }

    const seed = user?.displayName || user?.email || 'User';
    return generateAvatar(seed, 128);
}
