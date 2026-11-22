jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
}));

const User = require('../src/models/User');
const { getUserById } = require('../src/controllers/userController');

const flush = () => new Promise((resolve) => setImmediate(resolve));

const buildUser = (overrides = {}) => ({
    _id: 'user-1',
    displayName: 'Alice',
    avatar: 'avatar.png',
    rating: 4.5,
    reviews: 2,
    reputation: { trustScore: 80 },
    isOnline: true,
    createdAt: new Date('2024-01-01'),
    bio: 'Hello there',
    location: 'Somewhere',
    skills: ['Node.js'],
    skillEndorsements: [],
    stats: { totalPosts: 3 },
    lastSeenAt: new Date('2024-02-01'),
    email: 'alice@example.com',
    contactPhone: '+10000000000',
    contactWhatsapp: '+10000000001',
    pushTokens: [{ token: 'fcm-token' }],
    reports: [{ reason: 'spam' }],
    role: 'admin',
    googleId: 'google-1',
    passwordHash: 'hash',
    passwordSalt: 'salt',
    blockedUsers: ['blocked-1'],
    followers: ['follower-1'],
    following: ['following-1'],
    preferences: { profileVisibility: 'public', emailNotifications: true },
    ...overrides,
});

const mockSelect = (user) => {
    const select = jest.fn().mockResolvedValue(user);
    User.findById.mockReturnValue({ select });
    return select;
};

describe('getUserById public profile', () => {
    it('returns only whitelisted public fields and never leaks private data', async () => {
        const select = mockSelect(buildUser());
        const res = { json: jest.fn() };
        const next = jest.fn();

        getUserById({ params: { userId: 'user-1' }, user: { id: 'viewer-1' } }, res, next);
        await flush();

        expect(next).not.toHaveBeenCalled();
        expect(select).toHaveBeenCalledWith(expect.stringContaining('preferences.profileVisibility'));

        const profile = res.json.mock.calls[0][0];
        expect(profile).toEqual(expect.objectContaining({
            _id: 'user-1',
            displayName: 'Alice',
            bio: 'Hello there',
            location: 'Somewhere',
        }));
        for (const field of ['email', 'contactPhone', 'contactWhatsapp', 'pushTokens', 'reports', 'preferences', 'passwordHash', 'passwordSalt', 'blockedUsers', 'role', 'googleId']) {
            expect(profile).not.toHaveProperty(field);
        }
    });

    it('hides profile details when profileVisibility is private', async () => {
        mockSelect(buildUser({ preferences: { profileVisibility: 'private' } }));
        const res = { json: jest.fn() };
        const next = jest.fn();

        getUserById({ params: { userId: 'user-1' }, user: { id: 'viewer-1' } }, res, next);
        await flush();

        expect(next).not.toHaveBeenCalled();
        const profile = res.json.mock.calls[0][0];
        expect(profile).toEqual(expect.objectContaining({ _id: 'user-1', displayName: 'Alice', avatar: 'avatar.png' }));
        for (const field of ['bio', 'location', 'skills', 'skillEndorsements', 'stats', 'lastSeenAt', 'email', 'pushTokens', 'reports']) {
            expect(profile).not.toHaveProperty(field);
        }
    });

    it('returns 404 when the user does not exist', async () => {
        mockSelect(null);
        const next = jest.fn();

        getUserById({ params: { userId: 'missing' }, user: { id: 'viewer-1' } }, { json: jest.fn() }, next);
        await flush();

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
});
