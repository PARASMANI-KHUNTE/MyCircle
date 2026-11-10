const adminController = require('../src/controllers/adminController');

// Every route handler the admin routes reference. This guards against the
// class of bug where exports.requireAdmin overwrote the module exports
// object and silently discarded every handler.
const HANDLERS = [
    'getStats',
    'getActivity',
    'getUsers',
    'getUser',
    'updateUserRole',
    'banUser',
    'unbanUser',
    'getPayments',
    'getPayment',
    'getReports',
    'getReport',
    'resolveReport',
    'dismissReport',
    'escalateReport',
    'getServiceMetrics',
    'getAnalytics',
];

describe('Admin controller exports', () => {
    HANDLERS.forEach((name) => {
        it(`exports ${name} as a function`, () => {
            expect(typeof adminController[name]).toBe('function');
        });
    });

    it('exports requireAdmin without replacing the other handlers', () => {
        expect(typeof adminController.requireAdmin).toBe('function');
    });

    it('requireAdmin rejects non-admins with a 403 and does not call next', () => {
        const next = jest.fn();

        expect(() =>
            adminController.requireAdmin({ user: { role: 'user' } }, {}, next)
        ).toThrow('Admin access required');
        expect(next).not.toHaveBeenCalled();
    });

    it('requireAdmin rejects unauthenticated requests', () => {
        const next = jest.fn();

        expect(() => adminController.requireAdmin({}, {}, next)).toThrow('Admin access required');
        expect(next).not.toHaveBeenCalled();
    });

    it('requireAdmin admits admins and calls next', () => {
        const next = jest.fn();

        expect(() =>
            adminController.requireAdmin({ user: { role: 'admin' } }, {}, next)
        ).not.toThrow();
        expect(next).toHaveBeenCalledTimes(1);
    });
});
