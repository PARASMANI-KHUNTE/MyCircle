jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
}));

jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const auth = require('../src/middleware/auth');

const buildReq = () => ({ header: jest.fn().mockReturnValue('token') });

describe('auth middleware account status', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jwt.verify.mockReturnValue({ user: { id: 'user-1' } });
    });

    it('rejects suspended accounts with 403', async () => {
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ accountStatus: 'suspended' }),
        });
        const next = jest.fn();

        await auth(buildReq(), { json: jest.fn() }, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('allows active accounts', async () => {
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ accountStatus: 'active' }),
        });
        const next = jest.fn();
        const req = buildReq();

        await auth(req, { json: jest.fn() }, next);

        expect(req.user).toEqual({ id: 'user-1' });
        expect(next).toHaveBeenCalledWith();
    });
});
