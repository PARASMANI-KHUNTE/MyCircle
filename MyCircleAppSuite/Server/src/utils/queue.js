const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const pino = require('pino');

const logger = pino({ name: 'queue' });

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

let redisAvailable = false;

connection.on('ready', () => {
    redisAvailable = true;
    logger.info('Redis queue connection ready');
});

connection.on('error', (err) => {
    redisAvailable = false;
    logger.error({ error: err.message }, 'Redis connection error');
});

connection.on('end', () => {
    redisAvailable = false;
    logger.warn('Redis queue connection closed');
});

const createQueue = (name, options = {}) => {
    const { defaultJobOptions = {}, ...queueOptions } = options;

    return new Queue(name, {
        connection,
        skipVersionCheck: true,
        ...queueOptions,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: 100,
            removeOnFail: 100,
            ...defaultJobOptions,
        },
    });
};

const imageQueue = createQueue('image-processing', {
    defaultJobOptions: {
        priority: 2,
        timeout: 60000,
    },
});

const notificationQueue = createQueue('notifications', {
    defaultJobOptions: {
        priority: 1,
        timeout: 30000,
    },
});

const aiQueue = createQueue('ai-processing', {
    defaultJobOptions: {
        priority: 3,
        timeout: 120000,
    },
});

const cleanupQueue = createQueue('cleanup', {
    defaultJobOptions: {
        priority: 5,
        timeout: 60000,
    },
});

const addImageJob = async (data, options = {}) => {
    if (!redisAvailable) {
        logger.warn({ queue: 'image-processing' }, 'Skipping image job because Redis is unavailable');
        return null;
    }
    return imageQueue.add('process-image', data, options);
};

const addNotificationJob = async (data, options = {}) => {
    if (!redisAvailable) {
        logger.warn({ queue: 'notifications' }, 'Skipping notification job because Redis is unavailable');
        return null;
    }
    const { io, postId, relatedId, ...rest } = data || {};

    return notificationQueue.add('send-notification', {
        ...rest,
        relatedId: relatedId || postId || null,
    }, options);
};

const addAIJob = async (data, options = {}) => {
    if (!redisAvailable) {
        logger.warn({ queue: 'ai-processing' }, 'Skipping AI job because Redis is unavailable');
        return null;
    }
    return aiQueue.add('ai-task', data, options);
};

const addCleanupJob = async (data, options = {}) => {
    if (!redisAvailable) {
        logger.warn({ queue: 'cleanup' }, 'Skipping cleanup job because Redis is unavailable');
        return null;
    }
    return cleanupQueue.add('cleanup-task', data, options);
};

const closeQueueConnection = async () => {
    try {
        await Promise.all([
            imageQueue.close(),
            notificationQueue.close(),
            aiQueue.close(),
            cleanupQueue.close(),
        ]);
        await connection.quit();
    } catch (error) {
        logger.error({ error: error.message }, 'Failed to close queue connection cleanly');
    }
};

module.exports = {
    connection,
    imageQueue,
    notificationQueue,
    aiQueue,
    cleanupQueue,
    addImageJob,
    addNotificationJob,
    addAIJob,
    addCleanupJob,
    createQueue,
    closeQueueConnection,
};
