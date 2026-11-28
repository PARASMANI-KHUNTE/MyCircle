jest.mock('passport', () => ({
    logout: jest.fn((callback) => callback(null)),
}));

jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
}));

const router = require('../src/routes/authRoutes');

const logoutHandler = router.stack
    .find((layer) => layer.route && layer.route.path === '/logout')
    .route.stack[0].handle;

describe('logout redirect', () => {
    const originalClientUrl = process.env.CLIENT_URL;
    const originalClientUrlDev = process.env.CLIENT_URL_DEV;
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.CLIENT_URL = originalClientUrl;
        process.env.CLIENT_URL_DEV = originalClientUrlDev;
        process.env.NODE_ENV = originalNodeEnv;
    });

    it('redirects to the configured development client URL', () => {
        process.env.NODE_ENV = 'test';
        process.env.CLIENT_URL = 'https://app.example.com';
        process.env.CLIENT_URL_DEV = 'http://localhost:3000';

        const req = { logout: jest.fn((callback) => callback(null)) };
        const res = { redirect: jest.fn() };
        const next = jest.fn();

        logoutHandler(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000');
        expect(next).not.toHaveBeenCalled();
    });

    it('redirects to the configured production client URL', () => {
        process.env.NODE_ENV = 'production';
        process.env.CLIENT_URL = 'https://app.example.com';
        delete process.env.CLIENT_URL_DEV;

        const req = { logout: jest.fn((callback) => callback(null)) };
        const res = { redirect: jest.fn() };
        const next = jest.fn();

        logoutHandler(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('https://app.example.com');
    });
});
