jest.mock('../src/middleware/auth', () => jest.fn((req, res, next) => next()));
jest.mock('../src/middleware/upload', () => ({ array: jest.fn(() => (req, res, next) => next()) }));
jest.mock('../src/middleware/validateContent', () => ({
    validatePostContent: jest.fn((req, res, next) => next()),
}));
jest.mock('../src/controllers/postController', () => new Proxy({}, {
    get: () => jest.fn(),
}));

const router = require('../src/routes/postRoutes');
const { validatePostContent } = require('../src/middleware/validateContent');

describe('post routes', () => {
    it('validates content on post updates', () => {
        const updateLayer = router.stack.find((layer) =>
            layer.route?.path === '/:id' && layer.route.methods.put
        );

        expect(updateLayer).toBeDefined();
        expect(updateLayer.route.stack.some((layer) => layer.handle === validatePostContent)).toBe(true);
    });
});
