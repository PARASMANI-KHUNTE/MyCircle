jest.mock('../src/utils/rateLimitStore', () => ({
    createRateLimitStore: jest.fn(),
}));

const { createRateLimitStore } = require('../src/utils/rateLimitStore');
const { createRateLimiters, RATE_LIMIT_CONFIG } = require('../src/utils/rateLimiters');

describe('rate limiters', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        createRateLimitStore.mockReturnValue(undefined);
    });

    it('uses a distinct Redis key prefix for each limiter', () => {
        createRateLimiters();

        expect(createRateLimitStore).toHaveBeenCalledWith('api');
        expect(createRateLimitStore).toHaveBeenCalledWith('auth');
        expect(createRateLimitStore).toHaveBeenCalledWith('ai');
    });

    it('creates the api, auth and ai middleware', () => {
        const limiters = createRateLimiters();

        expect(typeof limiters.apiLimiter).toBe('function');
        expect(typeof limiters.authLimiter).toBe('function');
        expect(typeof limiters.aiLimiter).toBe('function');
    });

    it('keeps stricter limits for authentication and AI routes', () => {
        expect(RATE_LIMIT_CONFIG.auth.max).toBeLessThan(RATE_LIMIT_CONFIG.api.max);
        expect(RATE_LIMIT_CONFIG.ai.windowMs).toBeLessThan(RATE_LIMIT_CONFIG.api.windowMs);
    });
});
