import { buildAvatarSvg, generateAvatar, getAvatarUrl } from '../src/utils/avatar';

/* eslint-disable no-bitwise -- test decoder for the base64/UTF-8 avatar data URL */
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const base64ToBytes = (base64: string): number[] => {
    const bytes: number[] = [];
    let buffer = 0;
    let bits = 0;

    for (const character of base64) {
        if (character === '=') break;
        const value = BASE64_CHARS.indexOf(character);
        if (value < 0) continue;

        buffer = (buffer << 6) | value;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            bytes.push((buffer >> bits) & 0xFF);
        }
    }

    return bytes;
};

const bytesToUtf8 = (bytes: number[]): string => {
    let result = '';

    for (let index = 0; index < bytes.length;) {
        const first = bytes[index];
        if (first <= 0x7F) {
            result += String.fromCharCode(first);
            index += 1;
        } else if (first <= 0xDF) {
            result += String.fromCharCode(((first & 0x1F) << 6) | (bytes[index + 1] & 0x3F));
            index += 2;
        } else if (first <= 0xEF) {
            result += String.fromCharCode(
                ((first & 0x0F) << 12) | ((bytes[index + 1] & 0x3F) << 6) | (bytes[index + 2] & 0x3F)
            );
            index += 3;
        } else {
            result += String.fromCodePoint(
                0x10000 + ((first & 0x07) << 18) |
                ((bytes[index + 1] & 0x3F) << 12) |
                ((bytes[index + 2] & 0x3F) << 6) |
                (bytes[index + 3] & 0x3F)
            );
            index += 4;
        }
    }

    return result;
};

const decodeDataUrl = (uri: string): string => bytesToUtf8(base64ToBytes(uri.split(',')[1]));

describe('avatar generation', () => {
    it('uses the first two letters of a Latin name', () => {
        expect(buildAvatarSvg('Alice Cooper')).toContain('>AC</text>');
    });

    it('supports non-Latin names without throwing', () => {
        const svg = buildAvatarSvg('Анна Петрова');
        expect(svg).toContain('>АП</text>');
        expect(() => generateAvatar('的空间 名称')).not.toThrow();
    });

    it('encodes UTF-8 correctly in the data URL', () => {
        const uri = generateAvatar('的空间 名称');
        expect(decodeDataUrl(uri)).toContain('>的名</text>');
    });

    it('supports emoji and surrogate pairs in initials', () => {
        expect(buildAvatarSvg('😀 Test')).toContain('>😀T</text>');
        expect(() => generateAvatar('😀')).not.toThrow();
    });

    it('escapes XML-sensitive characters in initials', () => {
        expect(buildAvatarSvg('A & B')).toContain('>A&amp;</text>');
    });

    it('returns a base64 SVG data URL for missing avatars', () => {
        expect(getAvatarUrl({ displayName: 'Джон' })).toMatch(/^data:image\/svg\+xml;base64,/);
        expect(getAvatarUrl(null)).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('returns an existing avatar URL unchanged', () => {
        expect(getAvatarUrl({ avatar: 'https://example.com/avatar.png' }))
            .toBe('https://example.com/avatar.png');
    });
});
