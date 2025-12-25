const Post = require('../models/Post');
const User = require('../models/User');
const ContactRequest = require('../models/ContactRequest');
const { createNotification } = require('../controllers/notificationController');

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
            // Only notify if it was created more than 24 hours ago (don't notify immediately for 1-day posts)
            // Or just check if duration was > 1 day
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

    // Also run once on startup
    checkExpiredPosts(io);
    checkExpiredRequests(io);
};

module.exports = { startCronJobs };
