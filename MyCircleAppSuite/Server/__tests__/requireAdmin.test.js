const requireAdmin = require('../src/middleware/requireAdmin');

jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
}));

const User = require('../src/models/User');

describe('requireAdmin middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 when req.user is missing', async () => {
        const req = { user: undefined };
        const res = {};
        const next = jest.fn();
        await requireAdmin(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('returns 403 when user is not admin', async () => {
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: 'u1', role: 'user' }),
        });
        const req = { user: { id: 'u1' } };
        const res = {};
        const next = jest.fn();
        await requireAdmin(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('calls next when user is admin', async () => {
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: 'u1', role: 'admin' }),
        });
        const req = { user: { id: 'u1' } };
        const res = {};
        const next = jest.fn();
        await requireAdmin(req, res, next);
        expect(next).toHaveBeenCalledWith();
        expect(req.adminUser).toBeDefined();
    });
});
