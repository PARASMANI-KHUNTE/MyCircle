jest.mock('../src/models/User', () => ({
    findOne: jest.fn(),
    findById: jest.fn(),
}));

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a'.repeat(40);

const authRoutes = require('../src/routes/authRoutes');
const User = require('../src/models/User');
const { issueTokenPair } = require('../src/services/identity/tokenService');

const findRoute = (method, path) => {
    const layer = authRoutes.stack.find(
        (candidate) =>
            candidate.route &&
            candidate.route.path === path &&
            candidate.route.methods &&
            candidate.route.methods[method]
    );
    return layer?.route;
};

const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    redirect: jest.fn(),
    set: jest.fn().mockReturnThis(),
});

describe('Auth routes contract', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('exposes the mobile-facing endpoints', () => {
        expect(findRoute('post', '/refresh')).toBeTruthy();
        expect(findRoute('post', '/logout')).toBeTruthy();
        expect(findRoute('post', '/login')).toBeTruthy();
        expect(findRoute('post', '/register')).toBeTruthy();
    });

    describe('POST /auth/refresh', () => {
        const route = findRoute('post', '/refresh');

        // asyncHandler does not return its promise; resolve when the handler
        // settles via res.json or next().
        const invoke = (req) => {
            const res = createResponse();
            const next = jest.fn();
            return new Promise((resolve) => {
                res.json.mockImplementation(() => resolve({ res, next }));
                res.redirect.mockImplementation(() => resolve({ res, next }));
                next.mockImplementation(() => resolve({ res, next }));
                route.stack[route.stack.length - 1].handle(req, res, next);
            });
        };

        it('returns a rotated access/refresh pair (and legacy token alias)', async () => {
            const storedUser = {
                _id: 'user-1',
                id: 'user-1',
                email: 'user@example.com',
                role: 'user',
                displayName: 'User',
                banned: false,
            };
            const { refreshToken } = await issueTokenPair(storedUser);
            User.findById.mockImplementation(() => ({
                select: jest.fn().mockResolvedValue(storedUser),
            }));

            const { res, next } = await invoke({ body: { refreshToken } });

            expect(User.findById).toHaveBeenCalledWith('user-1');
            expect(next).not.toHaveBeenCalled();
            const payload = res.json.mock.calls[0][0];
            expect(payload).toEqual(
                expect.objectContaining({
                    accessToken: expect.any(String),
                    refreshToken: expect.any(String),
                    token: expect.any(String),
                })
            );
            expect(payload.token).toBe(payload.accessToken);
        });

        it('rejects a missing token with 400', async () => {
            const { next } = await invoke({ body: {} });

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: 400 })
            );
        });

        it('rejects a garbage token with 401', async () => {
            const { next } = await invoke({ body: { refreshToken: 'not-a-jwt' } });

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: 401 })
            );
        });

        it('rejects banned accounts with 401', async () => {
            const storedUser = {
                _id: 'user-2',
                id: 'user-2',
                email: 'banned@example.com',
                role: 'user',
                banned: true,
            };
            const { refreshToken } = await issueTokenPair(storedUser);
            User.findById.mockImplementation(() => ({
                select: jest.fn().mockResolvedValue(storedUser),
            }));

            const { next } = await invoke({ body: { refreshToken } });

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: 401 })
            );
        });
    });
});
