const Redis = require('ioredis');
const RedisStore = require('rate-limit-redis');

let redisClient = null;

const getRedisClient = () => {
    if (!process.env.REDIS_URL) {
        return null;
    }

    if (!redisClient) {
        redisClient = new Redis(process.env.REDIS_URL);
        redisClient.on('error', (error) => {
            console.error('[RateLimit] Redis error:', error.message);
        });
    }

    return redisClient;
};

/**
 * Build a Redis-backed rate-limit store.
 *
 * Each limiter must use a distinct prefix so counters for different policies
 * (api/auth/ai) never share keys in Redis.
 */
const createRateLimitStore = (prefix) => {
    const client = getRedisClient();
    if (!client) {
        return undefined;
    }

    return new RedisStore({
        sendCommand: (...args) => client.call(...args),
        prefix: `rl:${prefix}:`,
    });
};

module.exports = {
    createRateLimitStore,
    getRedisClient,
};
