const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Worker } = require('bullmq');
const sharp = require('sharp');
const { connection, closeQueueConnection } = require('../utils/queue');
const { createNotification } = require('../controllers/notificationController');
const { checkContentSafety } = require('../config/groq');
const pino = require('pino');

const logger = pino({ name: 'worker' });

if (!connection) {
    logger.error('REDIS_URL is required to run background workers');
    process.exit(1);
}

// Uploaded images live on Cloudinary (multer-storage-cloudinary returns the
// delivery URL in file.path), so the worker must download them before processing.
const FETCH_TIMEOUT_MS = 20000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// middleware/upload.js caps uploads at 1200x1200 via a Cloudinary `limit` transformation.
const EXPECTED_MAX_DIMENSION = 1200;

const fetchImageBuffer = async (url) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) {
        throw new Error(`Failed to download image (HTTP ${response.status})`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) {
        throw new Error(`Image exceeds the ${MAX_IMAGE_BYTES / 1024 / 1024}MB processing limit`);
    }
    return buffer;
};

// Insert a Cloudinary transformation into a delivery URL, e.g.
// https://res.cloudinary.com/<cloud>/image/upload/<transform>/v123/foo.jpg
const buildCloudinaryVariantUrl = (url, transformation) => {
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }
    const segments = parsed.pathname.split('/').filter(Boolean);
    const uploadIndex = segments.indexOf('upload');
    if (uploadIndex === -1) return null;
    segments.splice(uploadIndex + 1, 0, transformation);
    parsed.pathname = `/${segments.join('/')}`;
    return parsed.toString();
};

const imageWorker = new Worker('image-processing', async (job) => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing image');

    const { imagePath, action } = job.data;
    if (!imagePath) {
        throw new Error('imagePath is required');
    }

    if (action === 'optimize') {
        // Cloudinary already applies size/quality transformations at upload time;
        // this pass verifies the stored asset is downloadable, decodes as a real
        // image, and respects the upload-time dimension cap.
        const buffer = await fetchImageBuffer(imagePath);
        const metadata = await sharp(buffer).metadata();

        if (!metadata.width || !metadata.height) {
            throw new Error('Image could not be decoded');
        }
        if (metadata.width > EXPECTED_MAX_DIMENSION || metadata.height > EXPECTED_MAX_DIMENSION) {
            logger.warn(
                { jobId: job.id, width: metadata.width, height: metadata.height },
                'Stored image exceeds the upload-time dimension cap'
            );
        }

        return {
            success: true,
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            bytes: buffer.length,
        };
    }

    if (action === 'thumbnail') {
        // Thumbnails are derived on-demand via Cloudinary URL transformations;
        // request the variant once here so it is generated and cached eagerly.
        const thumbnailUrl = buildCloudinaryVariantUrl(imagePath, 'c_fill,w_200,h_200,q_70,f_jpg');
        if (!thumbnailUrl) {
            throw new Error('imagePath is not a Cloudinary delivery URL');
        }
        const response = await fetch(thumbnailUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (!response.ok) {
            throw new Error(`Thumbnail generation failed (HTTP ${response.status})`);
        }
        await response.arrayBuffer(); // consume body to complete the request

        return { success: true, thumbnailUrl };
    }

    return { success: true };
}, { connection, concurrency: 5, skipVersionCheck: true });

imageWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Image processed successfully');
});

imageWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Image processing failed');
});

const notificationWorker = new Worker('notifications', async (job) => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing notification');

    const { recipient, sender, type, title, message, link, conversationId, relatedId, postId } = job.data;

    // createNotification throws on DB failure so the job retries with backoff.
    await createNotification(null, {
        recipient,
        sender,
        type,
        title,
        message,
        link,
        conversationId,
        relatedId: relatedId || postId || null
    });
    return { success: true };
}, { connection, concurrency: 10, skipVersionCheck: true });

notificationWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Notification sent');
});

notificationWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Notification failed');
});

const aiWorker = new Worker('ai-processing', async (job) => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing AI task');

    const { taskType, content } = job.data;

    if (taskType === 'content-moderation') {
        const result = await checkContentSafety(content);
        return { success: true, result };
    }

    if (taskType === 'auto-tag') {
        // Auto-tagging logic
        return { success: true, tags: [] };
    }

    return { success: true };
}, { connection, concurrency: 3, skipVersionCheck: true });

aiWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'AI task completed');
});

aiWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'AI task failed');
});

const cleanupWorker = new Worker('cleanup', async (job) => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing cleanup task');

    const { taskType } = job.data;

    if (taskType === 'delete-old-messages') {
        // Delete old messages from Firestore
        return { success: true, deleted: 0 };
    }

    if (taskType === 'cleanup-images') {
        // Clean up unused images from Cloudinary
        return { success: true, cleaned: 0 };
    }

    return { success: true };
}, { connection, concurrency: 2, skipVersionCheck: true });

cleanupWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Cleanup task completed');
});

cleanupWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Cleanup task failed');
});

const workers = [imageWorker, notificationWorker, aiWorker, cleanupWorker];

let shuttingDown = false;
const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`${signal} received; closing workers`);
    const forcedExit = setTimeout(() => {
        logger.error('Worker shutdown timed out; forcing exit');
        process.exit(1);
    }, 10000);

    try {
        await Promise.all(workers.map((worker) => worker.close()));
        logger.info('All workers closed');
        await closeQueueConnection();
        clearTimeout(forcedExit);
        process.exit(0);
    } catch (error) {
        logger.error({ error: error.message }, 'Error during worker shutdown');
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
    logger.error({ reason: reason instanceof Error ? reason.message : String(reason) }, 'Unhandled rejection in worker');
});

module.exports = {
    imageWorker,
    notificationWorker,
    aiWorker,
    cleanupWorker,
};
