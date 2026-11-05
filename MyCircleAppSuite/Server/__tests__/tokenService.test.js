jest.mock('jsonwebtoken', () => ({
    sign: jest.fn((payload, secret, options, callback) => callback(null, 'signed-token')),
    verify: jest.fn((token, secret) => ({ user: { id: 'user-1' } })),
}));

const jwt = require('jsonwebtoken');
const {
    issueToken,
    toClaims,
    verifyToken,
} = require('../src/services/identity/tokenService');

describe('Identity token service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.JWT_EXPIRY = '2h';
    });

    it('creates stable user claims and signs them', async () => {
        const user = { id: 'user-1', email: 'user@example.com', role: 'user', displayName: 'User' };

        await expect(issueToken(user)).resolves.toBe('signed-token');
        expect(toClaims(user)).toEqual({
            user: { id: 'user-1', email: 'user@example.com', role: 'user' },
        });
        expect(jwt.sign).toHaveBeenCalledWith(
            toClaims(user),
            process.env.JWT_SECRET,
            { expiresIn: '2h' },
            expect.any(Function),
        );
    });

    it('delegates token verification to the identity boundary', () => {
        expect(verifyToken('token')).toEqual({ user: { id: 'user-1' } });
        expect(jwt.verify).toHaveBeenCalledWith('token', process.env.JWT_SECRET);
    });
});
