const rateLimit = require('express-rate-limit');
const { createRateLimitStore } = require('./rateLimitStore');

const RATE_LIMIT_CONFIG = {
    api: {
        prefix: 'api',
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.',
    },
    auth: {
        prefix: 'auth',
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many authentication attempts, please try again later.',
    },
    ai: {
        prefix: 'ai',
        windowMs: 60 * 1000,
        max: 20,
        message: 'Too many AI requests, please try again later.',
    },
};

const createLimiter = ({ prefix, windowMs, max, message }) => rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRateLimitStore(prefix),
});

/**
 * Create the API, auth and AI limiters.
 *
 * When REDIS_URL is configured all three share one Redis client but use
 * distinct key prefixes, so limits stay correct across clustered processes.
 */
const createRateLimiters = () => ({
    apiLimiter: createLimiter(RATE_LIMIT_CONFIG.api),
    authLimiter: createLimiter(RATE_LIMIT_CONFIG.auth),
    aiLimiter: createLimiter(RATE_LIMIT_CONFIG.ai),
});

module.exports = {
    createRateLimiters,
    RATE_LIMIT_CONFIG,
};
