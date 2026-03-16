const { Worker } = require('bullmq');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const { connection, imageQueue, notificationQueue, aiQueue } = require('../utils/queue');
const { createNotification } = require('../controllers/notificationController');
const { checkContentSafety } = require('../controllers/aiController');
const pino = require('pino');

const logger = pino({ name: 'worker' });

const imageWorker = new Worker('image-processing', async (job) => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing image');
    
    const { imagePath, publicId, userId, action } = job.data;

    try {
        if (action === 'optimize') {
            const optimized = await sharp(imagePath)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();
            
            return { success: true, size: optimized.length };
        }
        
        if (action === 'thumbnail') {
            const thumbnail = await sharp(imagePath)
                .resize(200, 200, { fit: 'cover' })
                .jpeg({ quality: 70 })
                .toBuffer();
            
            return { success: true, thumbnailSize: thumbnail.length };
        }

        return { success: true };
    } catch (error) {
        logger.error({ error: error.message }, 'Image processing failed');
        throw error;
    }
}, { connection, concurrency: 5, skipVersionCheck: true });

imageWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Image processed successfully');
});

imageWorker.on('failed', (job, err) => {
    logger.error({ jobId: job.id, error: err.message }, 'Image processing failed');
});

const notificationWorker = new Worker('notifications', async (job) => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing notification');
    
    const { io, recipient, sender, type, title, message, link, conversationId, postId } = job.data;
    
    try {
        await createNotification(io, {
            recipient,
            sender,
            type,
            title,
            message,
            link,
            conversationId,
            postId
        });
        return { success: true };
    } catch (error) {
        logger.error({ error: error.message }, 'Notification failed');
        throw error;
    }
}, { connection, concurrency: 10, skipVersionCheck: true });

notificationWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Notification sent');
});

notificationWorker.on('failed', (job, err) => {
    logger.error({ jobId: job.id, error: err.message }, 'Notification failed');
});

const aiWorker = new Worker('ai-processing', async (job) => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing AI task');
    
    const { taskType, content, postId, userId } = job.data;
    
    try {
        if (taskType === 'content-moderation') {
            const result = await checkContentSafety(content);
            return { success: true, result };
        }
        
        if (taskType === 'auto-tag') {
            // Auto-tagging logic
            return { success: true, tags: [] };
        }
        
        return { success: true };
    } catch (error) {
        logger.error({ error: error.message }, 'AI processing failed');
        throw error;
    }
}, { connection, concurrency: 3, skipVersionCheck: true });

aiWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'AI task completed');
});

aiWorker.on('failed', (job, err) => {
    logger.error({ jobId: job.id, error: err.message }, 'AI task failed');
});

const cleanupWorker = new Worker('cleanup', async (job) => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing cleanup task');
    
    const { taskType, data } = job.data;
    
    try {
        if (taskType === 'delete-old-messages') {
            // Delete old messages from Firestore
            return { success: true, deleted: 0 };
        }
        
        if (taskType === 'cleanup-images') {
            // Clean up unused images from Cloudinary
            return { success: true, cleaned: 0 };
        }
        
        return { success: true };
    } catch (error) {
        logger.error({ error: error.message }, 'Cleanup failed');
        throw error;
    }
}, { connection, concurrency: 2, skipVersionCheck: true });

cleanupWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Cleanup task completed');
});

cleanupWorker.on('failed', (job, err) => {
    logger.error({ jobId: job.id, error: err.message }, 'Cleanup task failed');
});

module.exports = {
    imageWorker,
    notificationWorker,
    aiWorker,
    cleanupWorker,
};