describe('createRateLimitStore', () => {
    const originalRedisUrl = process.env.REDIS_URL;

    beforeEach(() => {
        jest.resetModules();
        delete process.env.REDIS_URL;
    });

    afterAll(() => {
        if (originalRedisUrl === undefined) {
            delete process.env.REDIS_URL;
        } else {
            process.env.REDIS_URL = originalRedisUrl;
        }
    });

    it('falls back to the in-memory store when REDIS_URL is not configured', () => {
        const { createRateLimitStore } = require('../src/utils/rateLimitStore');

        expect(createRateLimitStore('api')).toBeUndefined();
    });

    it('creates a prefixed Redis store when REDIS_URL is configured', () => {
        process.env.REDIS_URL = 'redis://localhost:6379';

        const call = jest.fn();
        const on = jest.fn();
        const Redis = jest.fn(() => ({ call, on }));
        const RedisStore = jest.fn(function RedisStoreMock(options) {
            this.options = options;
        });

        jest.doMock('ioredis', () => Redis);
        jest.doMock('rate-limit-redis', () => RedisStore);

        const { createRateLimitStore } = require('../src/utils/rateLimitStore');
        const store = createRateLimitStore('auth');

        expect(Redis).toHaveBeenCalledWith('redis://localhost:6379');
        expect(RedisStore).toHaveBeenCalledWith(expect.objectContaining({
            prefix: 'rl:auth:',
        }));
        expect(store).toBeInstanceOf(RedisStore);

        const options = RedisStore.mock.calls[0][0];
        options.sendCommand('INCR', 'rate-limit-key');
        expect(call).toHaveBeenCalledWith('INCR', 'rate-limit-key');
    });

    it('reuses a single Redis client for every limiter', () => {
        process.env.REDIS_URL = 'redis://localhost:6379';

        const Redis = jest.fn(() => ({ call: jest.fn(), on: jest.fn() }));
        const RedisStore = jest.fn();

        jest.doMock('ioredis', () => Redis);
        jest.doMock('rate-limit-redis', () => RedisStore);

        const { createRateLimitStore } = require('../src/utils/rateLimitStore');
        createRateLimitStore('api');
        createRateLimitStore('ai');

        expect(Redis).toHaveBeenCalledTimes(1);
    });
});
