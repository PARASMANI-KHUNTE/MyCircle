const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Worker } = require('bullmq');
const { connection } = require('../utils/queue');
const pino = require('pino');
const {
    processImageJob,
    processNotificationJob,
    processAIJob,
    processCleanupJob,
} = require('./processors');

const logger = pino({ name: 'worker' });

if (!connection) {
    logger.error('REDIS_URL is required to run background workers');
    process.exit(1);
}

const createWorker = (name, processor, concurrency) => {
    const worker = new Worker(name, async (job) => {
        logger.info({ jobId: job.id, queue: name }, 'Processing job');
        try {
            return await processor(job);
        } catch (error) {
            logger.error({ jobId: job.id, queue: name, error: error.message }, 'Job failed');
            throw error;
        }
    }, { connection, concurrency, skipVersionCheck: true });

    worker.on('completed', (job) => {
        logger.info({ jobId: job.id, queue: name }, 'Job completed');
    });

    worker.on('failed', (job, err) => {
        logger.error({ jobId: job.id, queue: name, error: err.message }, 'Job failed');
    });

    return worker;
};

const imageWorker = createWorker('image-processing', processImageJob, 5);
const notificationWorker = createWorker('notifications', processNotificationJob, 10);
const aiWorker = createWorker('ai-processing', processAIJob, 3);
const cleanupWorker = createWorker('cleanup', processCleanupJob, 2);

module.exports = {
    imageWorker,
    notificationWorker,
    aiWorker,
    cleanupWorker,
};
