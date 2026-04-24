const Post = require('../models/Post');
const User = require('../models/User');
const ContactRequest = require('../models/ContactRequest');
const { createNotification } = require('../controllers/notificationController');
const cloudinary = require('../config/cloudinary');

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

/**
 * Initializes and starts the background jobs.
 * @param {object} io - Socket.io instance
 */
const startCronJobs = (io) => {
    console.log('[Cron] Background jobs initialized.');

    // Check every minute for precision
    setInterval(() => {
        checkExpiredPosts(io);
        checkExpiredRequests(io);
    }, 60 * 1000);

    // Check completed posts every hour
    setInterval(() => {
        checkCompletedPosts(io);
    }, 60 * 60 * 1000);

    // Also run once on startup
    checkExpiredPosts(io);
    checkExpiredRequests(io);
    checkCompletedPosts(io);
};

module.exports = { startCronJobs };
