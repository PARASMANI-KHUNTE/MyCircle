const fs = require('fs/promises');
const axios = require('axios');
const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');
const Post = require('../models/Post');
const Message = require('../models/Message');
const { createNotification } = require('../controllers/notificationController');
const { checkContentSafety } = require('../config/groq');

const POST_IMAGE_FOLDER = 'mycircle_posts';
const DEFAULT_MESSAGE_RETENTION_MS = 24 * 60 * 60 * 1000;

const readImage = async (imagePath) => {
    if (/^https?:\/\//i.test(imagePath)) {
        const response = await axios.get(imagePath, {
            responseType: 'arraybuffer',
            timeout: 15000,
        });
        return Buffer.from(response.data);
    }

    return fs.readFile(imagePath);
};

const derivePublicId = (imagePath) => {
    const withoutQuery = String(imagePath).split('?')[0];
    const match = withoutQuery.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^/.]+)?$/);
    return match ? match[1] : null;
};

const uploadImageBuffer = (buffer, publicId) => new Promise((resolve, reject) => {
    const options = {
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
    };

    if (!publicId.includes('/')) {
        options.folder = POST_IMAGE_FOLDER;
    }

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(result);
    });

    stream.end(buffer);
});

const processImageJob = async (job) => {
    const { imagePath, publicId, action = 'optimize', postId } = job.data || {};

    if (!imagePath) throw new Error('imagePath is required');
    if (!postId) throw new Error('postId is required');

    const targetPublicId = publicId || derivePublicId(imagePath);
    if (!targetPublicId) throw new Error('Unable to determine Cloudinary public_id');

    const input = await readImage(imagePath);

    if (action === 'optimize') {
        const optimized = await sharp(input)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

        const uploaded = await uploadImageBuffer(optimized, targetPublicId);

        // Cloudinary returns a fresh secure URL; keep the post document in sync so
        // clients never receive a stale image reference.
        await Post.updateOne(
            { _id: postId, images: imagePath },
            { $set: { 'images.$': uploaded.secure_url } }
        );

        return { success: true, url: uploaded.secure_url, size: optimized.length };
    }

    if (action === 'thumbnail') {
        const thumbnail = await sharp(input)
            .resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 70 })
            .toBuffer();

        const uploaded = await uploadImageBuffer(thumbnail, `${targetPublicId}_thumbnail`);

        return { success: true, thumbnailUrl: uploaded.secure_url, size: thumbnail.length };
    }

    throw new Error(`Unsupported image action: ${action}`);
};

const processNotificationJob = async (job) => {
    const { recipient, sender, type, event, title, message, link, conversationId, relatedId, postId } = job.data || {};

    await createNotification(null, {
        recipient,
        sender,
        type,
        event,
        title,
        message,
        link,
        conversationId,
        relatedId: relatedId || postId || null,
    });

    return { success: true };
};

const processAIJob = async (job) => {
    const { taskType, content, postId } = job.data || {};

    if (taskType === 'content-moderation') {
        const result = await checkContentSafety(content);
        const moderationStatus = result.safe === false ? 'hidden' : 'visible';

        if (postId) {
            await Post.updateOne({ _id: postId }, { $set: { moderationStatus } });
        }

        return { success: true, result, moderationStatus };
    }

    throw new Error(`Unsupported AI task: ${taskType}`);
};

const processCleanupJob = async (job) => {
    const { taskType, data = {} } = job.data || {};

    if (taskType === 'delete-old-messages') {
        const cutoff = data.cutoff
            ? new Date(data.cutoff)
            : new Date(Date.now() - DEFAULT_MESSAGE_RETENTION_MS);

        const result = await Message.deleteMany({ expiresAt: { $lt: cutoff } });
        return { success: true, deleted: result.deletedCount || 0 };
    }

    throw new Error(`Unsupported cleanup task: ${taskType}`);
};

module.exports = {
    processImageJob,
    processNotificationJob,
    processAIJob,
    processCleanupJob,
};
