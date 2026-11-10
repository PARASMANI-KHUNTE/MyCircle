const Post = require('../models/Post');
const ContactRequest = require('../models/ContactRequest');
const Conversation = require('../models/Conversation');
const { createNotification } = require('../controllers/notificationController');
const { deleteConversationArtifacts } = require('./chatLifecycle');

/**
 * Delete old images from Cloudinary that are no longer referenced
 */
const cleanupOrphanedImages = async () => {
    try {
        // Get all active post image URLs
        const activePosts = await Post.find({ 
            images: { $exists: true, $ne: [] } 
        }).select('images');
        
        // Collect all referenced image URLs
        const referencedUrls = new Set();
        for (const post of activePosts) {
            if (post.images) {
                post.images.forEach(url => {
                    if (url && url.includes('cloudinary')) {
                        referencedUrls.add(url);
                    }
                });
            }
        }
        
        // Note: Full Cloudinary cleanup requires listing all resources
        // This is just a placeholder - in production you'd compare against Cloudinary folder
        console.log(`[Cron] Found ${referencedUrls.size} active images`);
        
    } catch (error) {
        console.error('[Cron] Error cleaning up images:', error);
    }
};

/**
 * Auto-archive completed posts after 7 days of completion
 */
const checkCompletedPosts = async (io) => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Find completed posts that were completed > 7 days ago
        const oldCompletedPosts = await Post.find({
            status: 'completed',
            completedAt: { $lt: sevenDaysAgo }
        });
        
        for (const post of oldCompletedPosts) {
            post.status = 'archived';
            await post.save();
            
            if (io) {
                try {
                    await createNotification(io, {
                        recipient: post.user,
                        type: 'info',
                        title: 'Post Archived',
                        message: `Your completed post "${post.title}" has been archived.`,
                        link: '/my-posts'
                    });
                } catch (nErr) {
                    console.error(`[Cron] Notification failed:`, nErr.message);
                }
            }
        }
        
        if (oldCompletedPosts.length > 0) {
            console.log(`[Cron] Auto-archived ${oldCompletedPosts.length} completed posts`);
        }
        
    } catch (error) {
        console.error('[Cron] Error checking completed posts:', error);
    }
};

/**
 * Auto-expires pending contact requests older than 7 days.
 */
const checkExpiredRequests = async (io) => {
    try {
        const now = new Date();

        // Find and update expired pending requests
        const expiredRequests = await ContactRequest.find({
            status: 'pending',
            expiresAt: { $lt: now }
        }).populate('requester', 'displayName').populate('post', 'title');

        for (const request of expiredRequests) {
            request.status = 'expired';
            await request.save();

            // Notify requester that their request expired
            if (io && request.requester) {
                try {
                    await createNotification(io, {
                        recipient: request.requester._id,
                        type: 'info',
                        title: 'Request Expired',
                        message: `Your contact request for "${request.post?.title || 'a post'}" has expired.`,
                        link: '/requests'
                    });
                } catch (nErr) {
                    console.error(`[Cron] Notification failed for request ${request._id}:`, nErr.message);
                }
            }
        }

        if (expiredRequests.length > 0) {
            console.log(`[Cron] Expired ${expiredRequests.length} pending contact requests.`);
        }
    } catch (error) {
        console.error('[Cron] Error checking expired requests:', error);
    }
};

/**
 * Checks for expired posts and those nearing expiration.
 * Sends notifications and updates status accordingly.
 */
const checkExpiredPosts = async (io) => {
    try {
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        // 1. Handle Actual Expiration
        const expiredPosts = await Post.find({
            expiresAt: { $lt: now },
            status: 'active',
            isActive: true,
            notifiedExpired: { $ne: true }
        });

        for (const post of expiredPosts) {
            post.status = 'archived';
            post.isActive = false;
            post.notifiedExpired = true;
            await post.save();

            // Disable related conversations
            try {
                await Conversation.updateMany(
                    { postId: post._id },
                    { $set: { isActive: false } }
                );
            } catch (convErr) {
                console.error('[Cron] Failed to disable conversations:', convErr.message);
            }

            if (io) {
                try {
                    await createNotification(io, {
                        recipient: post.user,
                        type: 'info',
                        title: 'Post Archived',
                        message: `Your post "${post.title}" has expired and is now archived.`,
                        link: `/post/${post._id}`,
                        relatedId: post._id
                    });
                } catch (nErr) {
                    console.error(`[Cron] Notification failed for post ${post._id}:`, nErr.message);
                }
            }
        }

        // 2. Handle 5 Minute Warning
        const urgentPosts = await Post.find({
            expiresAt: { $gt: now, $lt: fiveMinutesFromNow },
            status: 'active',
            isActive: true,
            notified5m: { $ne: true }
        });

        for (const post of urgentPosts) {
            post.notified5m = true;
            await post.save();

            if (io) {
                try {
                    await createNotification(io, {
                        recipient: post.user,
                        type: 'info',
                        title: 'Expiring Soon!',
                        message: `Your post "${post.title}" will expire in 5 minutes. Extend it now!`,
                        link: `/post/${post._id}`,
                        relatedId: post._id
                    });
                } catch (nErr) {
                    console.error(`[Cron] 5m warning failed for post ${post._id}:`, nErr.message);
                }
            }
        }

        // 3. Handle 1 Day Warning
        const warningPosts = await Post.find({
            expiresAt: { $gt: now, $lt: oneDayFromNow },
            status: 'active',
            isActive: true,
            notified1d: { $ne: true }
        });

        for (const post of warningPosts) {
            // Check if post is at least 24 hours old OR if its total duration was > 2 days
            // This prevents "1 Day Left" notifications immediately for 24h/48h posts.
            const ageInHours = (now.getTime() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);

            if (ageInHours < 24 && post.duration <= 2880) {
                // If post is new AND duration is <= 2 days, skip the 1d warning (it's too noisy)
                post.notified1d = true; // Mark as "notified" to skip future checks for this post
                await post.save();
                continue;
            }

            post.notified1d = true;
            await post.save();

            if (io) {
                try {
                    await createNotification(io, {
                        recipient: post.user,
                        type: 'info',
                        title: '1 Day Left',
                        message: `Your post "${post.title}" will expire in 24 hours.`,
                        link: `/post/${post._id}`,
                        relatedId: post._id
                    });
                } catch (nErr) {
                    console.error(`[Cron] 1d warning failed for post ${post._id}:`, nErr.message);
                }
            }
        }

    } catch (error) {
        console.error('[Cron] Error checking expired posts:', error);
    }
};

const cleanupExpiredChats = async (io) => {
    try {
        const now = new Date();
        const expiredConversations = await Conversation.find({
            expiresAt: { $lt: now }
        }).select('_id participants');

        for (const conversation of expiredConversations) {
            // Reuse the shared lifecycle cleanup so notifications are removed
            // and participants are told the conversation is gone
            await deleteConversationArtifacts({
                conversationId: conversation._id,
                conversation,
                io,
                reason: 'Conversation expired',
            });
        }

        if (expiredConversations.length > 0) {
            console.log(`[Cron] Deleted ${expiredConversations.length} expired conversations.`);
        }
    } catch (error) {
        console.error('[Cron] Error cleaning expired chats:', error);
    }
};

/**
 * Wraps a job so overlapping runs are skipped: if the previous tick is still
 * running when the next one fires, the new tick is ignored.
 */
const createOverlapGuard = (job) => {
    let running = false;
    return async (...args) => {
        if (running) {
            console.warn('[Cron] Previous run still in progress, skipping tick');
            return;
        }
        running = true;
        try {
            await job(...args);
        } finally {
            running = false;
        }
    };
};

/**
 * Initializes and starts the background jobs.
 * @param {object} io - Socket.io instance
 */
const startCronJobs = (io) => {
    // Escape hatch for horizontally scaled deployments: cron must only run on
    // one instance or expiry/cleanup work (and its notifications) duplicates.
    // Set ENABLE_CRON=false on every instance except one.
    if (process.env.ENABLE_CRON === 'false') {
        console.log('[Cron] ENABLE_CRON=false; background jobs disabled on this instance.');
        return;
    }

    console.log('[Cron] Background jobs initialized.');

    const guardedCheckExpiredPosts = createOverlapGuard((ioRef) => checkExpiredPosts(ioRef));
    const guardedCheckExpiredRequests = createOverlapGuard((ioRef) => checkExpiredRequests(ioRef));
    const guardedCleanupExpiredChats = createOverlapGuard((ioRef) => cleanupExpiredChats(ioRef));
    const guardedCheckCompletedPosts = createOverlapGuard((ioRef) => checkCompletedPosts(ioRef));

    // Check every minute for precision
    setInterval(() => {
        guardedCheckExpiredPosts(io);
        guardedCheckExpiredRequests(io);
        guardedCleanupExpiredChats(io);
    }, 60 * 1000);

    // Check completed posts every hour
    setInterval(() => {
        guardedCheckCompletedPosts(io);
    }, 60 * 60 * 1000);

    // Also run once on startup
    guardedCheckExpiredPosts(io);
    guardedCheckExpiredRequests(io);
    guardedCheckCompletedPosts(io);
    guardedCleanupExpiredChats(io);
};

module.exports = { startCronJobs };
