/* eslint-disable no-bitwise -- base64 and hash calculations are intentionally bitwise */
/**
 * Generate a colorful, unique avatar based on user's name
 * Uses a deterministic algorithm to create consistent avatars
 */

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const toUtf8Bytes = (value: string): number[] => {
    const bytes: number[] = [];

    for (let index = 0; index < value.length; index += 1) {
        let codePoint = value.codePointAt(index) ?? 0;
        if (codePoint > 0xFFFF) {
            index += 1;
        }

        if (codePoint <= 0x7F) {
            bytes.push(codePoint);
        } else if (codePoint <= 0x7FF) {
            bytes.push(0xC0 | (codePoint >> 6), 0x80 | (codePoint & 0x3F));
        } else if (codePoint <= 0xFFFF) {
            bytes.push(
                0xE0 | (codePoint >> 12),
                0x80 | ((codePoint >> 6) & 0x3F),
                0x80 | (codePoint & 0x3F)
            );
        } else {
            bytes.push(
                0xF0 | (codePoint >> 18),
                0x80 | ((codePoint >> 12) & 0x3F),
                0x80 | ((codePoint >> 6) & 0x3F),
                0x80 | (codePoint & 0x3F)
            );
        }
    }

    return bytes;
};

const utf8ToBase64 = (value: string): string => {
    const bytes = toUtf8Bytes(value);
    let output = '';

    for (let index = 0; index < bytes.length; index += 3) {
        const first = bytes[index];
        const second = bytes[index + 1];
        const third = bytes[index + 2];
        const hasSecond = second !== undefined;
        const hasThird = third !== undefined;

        output += BASE64_CHARS[first >> 2];
        output += BASE64_CHARS[((first & 0x03) << 4) | (hasSecond ? second >> 4 : 0)];
        output += hasSecond ? BASE64_CHARS[((second & 0x0F) << 2) | (hasThird ? third >> 6 : 0)] : '=';
        output += hasThird ? BASE64_CHARS[third & 0x3F] : '=';
    }

    return output;
};

const escapeXml = (value: string): string => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export function buildAvatarSvg(name: string, size: number = 128): string {
    const hash = Array.from(name).reduce((acc, char) => {
        return (char.codePointAt(0) ?? 0) + ((acc << 5) - acc);
    }, 0);

    const hue = Math.abs(hash % 360);
    const saturation = 65 + (Math.abs(hash) % 20);
    const lightness = 50 + (Math.abs(hash) % 15);

    const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const textColor = lightness > 60 ? '#1a1a1a' : '#ffffff';

    const initials = name
        .trim()
        .split(/\s+/u)
        .map(word => Array.from(word)[0] ?? '')
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toLocaleUpperCase();

    return `
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
            >${escapeXml(initials)}</text>
        </svg>
    `;
}

export function generateAvatar(name: string, size: number = 128): string {
    return `data:image/svg+xml;base64,${utf8ToBase64(buildAvatarSvg(name, size))}`;
}

/**
 * Get avatar URL - returns user's avatar or generates one
 */
export function getAvatarUrl(user: { avatar?: string; displayName?: string; email?: string } | null): string {
    if (user?.avatar && user.avatar.length > 0) {
        return user.avatar;
    }

    const displayName = user?.displayName || user?.email || 'User';
    return generateAvatar(displayName);
}
