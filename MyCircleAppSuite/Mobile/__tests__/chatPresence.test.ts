import {
    formatPresenceStatus,
    getParticipantId,
    resolveOtherParticipant,
    resolvePresenceOverride,
} from '../src/utils/chatPresence';

describe('chat presence', () => {
    const me = { _id: 'me', displayName: 'Me', isOnline: true };
    const other = { _id: 'other', displayName: 'Ada', isOnline: false };

    it('waits for the current user before choosing a recipient', () => {
        expect(resolveOtherParticipant([me, other], null)).toBe(null);
        expect(resolveOtherParticipant([me, other], undefined, other)).toBe(null);
    });

    it('never resolves the current user as the other participant', () => {
        expect(resolveOtherParticipant([me, other], 'me')).toEqual(other);
        expect(resolveOtherParticipant([me], 'me', me)).toBe(null);
        expect(resolveOtherParticipant([], 'me', other)).toEqual(other);
    });

    it('lets live presence events override the conversation snapshot', () => {
        expect(resolvePresenceOverride(other, {})).toBe(false);
        expect(resolvePresenceOverride(other, { other: true })).toBe(true);
        expect(resolvePresenceOverride(me, { me: false })).toBe(false);
        expect(resolvePresenceOverride(null, { other: true })).toBe(false);
    });

    it('formats only known presence states', () => {
        expect(getParticipantId(other)).toBe('other');
        expect(formatPresenceStatus(true)).toBe('Online');
        expect(formatPresenceStatus(false)).toBe('Offline');
    });
});
