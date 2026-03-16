const Redis = require('ioredis');
const logger = require('./logger');

const isProduction = process.env.NODE_ENV === 'production';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
});

redisClient.on('error', (err) => {
    logger.error({ error: err.message }, 'Redis error');
});

redisClient.on('connect', () => {
    logger.info('Redis connected');
});

const isEnabled = () => process.env.REDIS_URL && isProduction;

const DEFAULT_TTL = 300;

const cacheGet = async (key) => {
    if (!isEnabled()) return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        logger.error({ key, error: err.message }, 'Cache get error');
        return null;
    }
};

const cacheSet = async (key, value, ttl = DEFAULT_TTL) => {
    if (!isEnabled()) return;
    try {
        await redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (err) {
        logger.error({ key, error: err.message }, 'Cache set error');
    }
};

const cacheDelete = async (key) => {
    if (!isEnabled()) return;
    try {
        await redisClient.del(key);
    } catch (err) {
        logger.error({ key, error: err.message }, 'Cache delete error');
    }
};

const cacheDeletePattern = async (pattern) => {
    if (!isEnabled()) return;
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
    } catch (err) {
        logger.error({ pattern, error: err.message }, 'Cache delete pattern error');
    }
};

const cacheMiddleware = (ttl = DEFAULT_TTL) => {
    return async (req, res, next) => {
        if (!isEnabled()) return next();
        
        const key = `cache:${req.originalUrl}`;
        
        try {
            const cached = await redisClient.get(key);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
            
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                redisClient.setex(key, ttl, JSON.stringify(data)).catch(() => {});
                return originalJson(data);
            };
            
            next();
        } catch (err) {
            next();
        }
    };
};

module.exports = {
    redisClient,
    cacheGet,
    cacheSet,
    cacheDelete,
    cacheDeletePattern,
    cacheMiddleware,
    isEnabled,
};