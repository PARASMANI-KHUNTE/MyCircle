const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

connection.on('error', (err) => {
    console.error('Redis connection error:', err.message);
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
    return imageQueue.add('process-image', data, options);
};

const addNotificationJob = async (data, options = {}) => {
    const { io, postId, relatedId, ...rest } = data || {};

    return notificationQueue.add('send-notification', {
        ...rest,
        relatedId: relatedId || postId || null,
    }, options);
};

const addAIJob = async (data, options = {}) => {
    return aiQueue.add('ai-task', data, options);
};

const addCleanupJob = async (data, options = {}) => {
    return cleanupQueue.add('cleanup-task', data, options);
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
};
