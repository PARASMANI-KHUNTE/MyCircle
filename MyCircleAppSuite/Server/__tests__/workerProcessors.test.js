const { PassThrough } = require('stream');

jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('fs/promises', () => ({ readFile: jest.fn() }));

const mockSharpChain = {
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized')),
};

jest.mock('sharp', () => jest.fn(() => mockSharpChain));

jest.mock('../src/config/cloudinary', () => ({
    uploader: { upload_stream: jest.fn() },
}));

jest.mock('../src/models/Post', () => ({
    updateOne: jest.fn(),
}));

jest.mock('../src/models/Message', () => ({
    deleteMany: jest.fn(),
}));

jest.mock('../src/controllers/notificationController', () => ({
    createNotification: jest.fn(),
}));

jest.mock('../src/config/groq', () => ({
    checkContentSafety: jest.fn(),
}));

const axios = require('axios');
const sharp = require('sharp');
const cloudinary = require('../src/config/cloudinary');
const Post = require('../src/models/Post');
const Message = require('../src/models/Message');
const { createNotification } = require('../src/controllers/notificationController');
const { checkContentSafety } = require('../src/config/groq');
const {
    processImageJob,
    processNotificationJob,
    processAIJob,
    processCleanupJob,
} = require('../src/workers/processors');

const imagePath = 'https://res.cloudinary.com/demo/image/upload/v123/mycircle_posts/abc123.jpg';

describe('worker processors', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSharpChain.toBuffer.mockResolvedValue(Buffer.from('optimized'));
        axios.get.mockResolvedValue({ data: Buffer.from('remote-image') });
        cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
            const stream = new PassThrough();
            stream.on('finish', () => callback(null, {
                secure_url: `https://res.cloudinary.com/demo/image/upload/${options.public_id}.jpg`,
            }));
            return stream;
        });
    });

    describe('image processing', () => {
        it('uploads the optimized image and updates the post reference', async () => {
            const result = await processImageJob({ data: { imagePath, postId: 'post-1' } });

            expect(axios.get).toHaveBeenCalledWith(imagePath, expect.objectContaining({
                responseType: 'arraybuffer',
            }));
            expect(sharp).toHaveBeenCalledWith(Buffer.from('remote-image'));
            expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
                expect.objectContaining({ public_id: 'mycircle_posts/abc123', overwrite: true }),
                expect.any(Function)
            );
            expect(Post.updateOne).toHaveBeenCalledWith(
                { _id: 'post-1', images: imagePath },
                { $set: { 'images.$': 'https://res.cloudinary.com/demo/image/upload/mycircle_posts/abc123.jpg' } }
            );
            expect(result).toEqual(expect.objectContaining({ success: true }));
        });

        it('rejects jobs that are not attached to a saved post', async () => {
            await expect(processImageJob({ data: { imagePath } })).rejects.toThrow('postId is required');

            expect(axios.get).not.toHaveBeenCalled();
            expect(Post.updateOne).not.toHaveBeenCalled();
        });

        it('uploads thumbnails under a derived public id', async () => {
            const result = await processImageJob({
                data: { imagePath, postId: 'post-1', action: 'thumbnail' },
            });

            expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
                expect.objectContaining({ public_id: 'mycircle_posts/abc123_thumbnail' }),
                expect.any(Function)
            );
            expect(result.thumbnailUrl).toBe('https://res.cloudinary.com/demo/image/upload/mycircle_posts/abc123_thumbnail.jpg');
        });

        it('rejects unsupported image actions instead of silently succeeding', async () => {
            await expect(processImageJob({
                data: { imagePath, postId: 'post-1', action: 'unknown' },
            })).rejects.toThrow('Unsupported image action');
        });
    });

    describe('AI processing', () => {
        it('hides posts flagged by content moderation', async () => {
            checkContentSafety.mockResolvedValue({ safe: false, reason: 'spam' });

            const result = await processAIJob({
                data: { taskType: 'content-moderation', content: 'buy followers', postId: 'post-1' },
            });

            expect(Post.updateOne).toHaveBeenCalledWith(
                { _id: 'post-1' },
                { $set: { moderationStatus: 'hidden' } }
            );
            expect(result.moderationStatus).toBe('hidden');
        });

        it('restores visibility for safe content', async () => {
            checkContentSafety.mockResolvedValue({ safe: true });

            const result = await processAIJob({
                data: { taskType: 'content-moderation', content: 'plumbing service', postId: 'post-1' },
            });

            expect(Post.updateOne).toHaveBeenCalledWith(
                { _id: 'post-1' },
                { $set: { moderationStatus: 'visible' } }
            );
            expect(result.moderationStatus).toBe('visible');
        });

        it('rejects unimplemented AI tasks instead of returning empty results', async () => {
            await expect(processAIJob({ data: { taskType: 'auto-tag', postId: 'post-1' } }))
                .rejects.toThrow('Unsupported AI task');
        });
    });

    describe('cleanup', () => {
        it('returns the real number of deleted messages', async () => {
            Message.deleteMany.mockResolvedValue({ deletedCount: 4 });

            const result = await processCleanupJob({ data: { taskType: 'delete-old-messages' } });

            expect(Message.deleteMany).toHaveBeenCalledWith({ expiresAt: { $lt: expect.any(Date) } });
            expect(result).toEqual({ success: true, deleted: 4 });
        });

        it('rejects unimplemented cleanup tasks', async () => {
            await expect(processCleanupJob({ data: { taskType: 'cleanup-images' } }))
                .rejects.toThrow('Unsupported cleanup task');
        });
    });

    it('forwards notification jobs with a related id fallback', async () => {
        const result = await processNotificationJob({
            data: { recipient: 'user-1', type: 'info', postId: 'post-1' },
        });

        expect(createNotification).toHaveBeenCalledWith(null, expect.objectContaining({
            recipient: 'user-1',
            relatedId: 'post-1',
        }));
        expect(result).toEqual({ success: true });
    });
});
