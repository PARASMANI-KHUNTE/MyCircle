/**
 * Generate a colorful, unique avatar based on user's name
 * Uses a deterministic algorithm to create consistent avatars
 */
export function generateAvatar(name, size = 128) {
    // Create a hash from the name for consistent colors
    const hash = name.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Generate colors from hash
    const hue = Math.abs(hash % 360);
    const saturation = 65 + (Math.abs(hash) % 20);
    const lightness = 50 + (Math.abs(hash) % 15);

    const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const textColor = lightness > 60 ? '#1a1a1a' : '#ffffff';

    // Get initials (max 2 characters)
    const initials = name
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

    // Convert to data URL
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Get avatar URL - returns user's avatar or generates one using Dicebear
 */
export function getAvatarUrl(user) {
    // Check various avatar field names (Google auth may use different fields)
    const avatarUrl = user?.avatar || user?.picture || user?.photoURL || user?.photo;

    if (avatarUrl && avatarUrl.length > 0) {
        // If it's already a full URL, return it
        if (avatarUrl.startsWith('http')) {
            return avatarUrl;
        }
        // If it's a relative path, prepend API URL
        if (avatarUrl.startsWith('/')) {
            return avatarUrl;
        }
    }

    const seed = user?.displayName || user?.email || 'User';
    // Use Dicebear as primary fallback for a better look
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}
