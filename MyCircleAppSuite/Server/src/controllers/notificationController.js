const Notification = require('../models/Notification');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { publishNotification } = require('../utils/notificationBus');
const { sendPushNotification } = require('../utils/pushNotifications');

const DEFAULT_NOTIFICATION_LIMIT = 30;
const MAX_NOTIFICATION_LIMIT = 100;

const parsePagination = (query, defaultLimit, maxLimit) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const requestedLimit = parseInt(query.limit, 10) || defaultLimit;
    const limit = Math.min(Math.max(requestedLimit, 1), maxLimit);

    return {
        page,
        limit,
        skip: (page - 1) * limit
    };
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
    const { page, limit, skip } = parsePagination(
        req.query,
        DEFAULT_NOTIFICATION_LIMIT,
        MAX_NOTIFICATION_LIMIT
    );

    const [notifications, total] = await Promise.all([
        Notification.find({ recipient: req.user.id })
            .populate('sender', 'displayName avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Notification.countDocuments({ recipient: req.user.id })
    ]);

    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));
    res.set('X-Total-Count', String(total));
    res.set('X-Has-More', String(skip + notifications.length < total));

    res.json(notifications);
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({ recipient: req.user.id, read: false });
    res.json({ count });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ msg: 'Notification not found' });

        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        notification.read = true;
        await notification.save();
        res.json(notification);
    } catch (err) {
        return next(err);
    }
};

// @desc    Mark ALL as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, read: false },
            { $set: { read: true } }
        );
        res.json({ msg: 'All marked as read' });
    } catch (err) {
        return next(err);
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ msg: 'Notification not found' });

        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await notification.deleteOne();
        res.json({ msg: 'Notification removed' });
    } catch (err) {
        return next(err);
    }
};

// @desc    Clear ALL notifications
// @route   DELETE /api/notifications
// @access  Private
exports.deleteAll = async (req, res, next) => {
    try {
        await Notification.deleteMany({ recipient: req.user.id });
        res.json({ msg: 'All notifications cleared' });
    } catch (err) {
        return next(err);
    }
};

// @desc    Register a device for push notifications
// @route   POST /api/notifications/device-token
// @access  Private
exports.registerDeviceToken = asyncHandler(async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const platform = ['ios', 'android', 'web'].includes(req.body?.platform) ? req.body.platform : 'web';

    if (!token) {
        return res.status(400).json({ msg: 'A device token is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ msg: 'User not found' });
    }

    user.pushTokens = user.pushTokens || [];
    const existing = user.pushTokens.find((entry) => entry.token === token);
    if (existing) {
        existing.platform = platform;
        existing.createdAt = new Date();
    } else {
        user.pushTokens.push({ token, platform, createdAt: new Date() });
    }

    // Keep the most recent devices so a user cannot accumulate unbounded tokens.
    user.pushTokens = user.pushTokens.slice(-10);
    await user.save();

    res.json({ msg: 'Device token registered' });
});

// @desc    Remove a device token (all tokens when none is supplied)
// @route   DELETE /api/notifications/device-token
// @access  Private
exports.unregisterDeviceToken = asyncHandler(async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';

    const update = token
        ? { $pull: { pushTokens: { token } } }
        : { $set: { pushTokens: [] } };

    await User.findByIdAndUpdate(req.user.id, update);
    res.json({ msg: 'Device token removed' });
});

// Helper to create and emit notification (internal use)
exports.createNotification = async (io, { recipient, sender, type, title, message, link, relatedId, conversationId = null, event }) => {
    try {
        if (!recipient) {
            console.error("[Notification] No recipient provided.");
            return;
        }

        // Safe ID comparison
        const recipientIdStr = recipient._id ? recipient._id.toString() : recipient.toString();
        const senderIdStr = sender?._id ? sender._id.toString() : sender?.toString();

        if (senderIdStr && recipientIdStr === senderIdStr) return; // Don't notify self

        const eventByType = {
            request: 'contact_request',
            approval: 'application_accepted',
            message: 'message',
            like: 'like',
            comment: 'comment',
        };
        const notification = new Notification({
            recipient,
            sender,
            type,
            event: event || eventByType[type] || 'system',
            title,
            message,
            link,
            relatedId,
            conversationId
        });
        await notification.save();
        await notification.populate('sender', 'displayName avatar');

        const emittedNotification = notification.toObject();
        if (relatedId) {
            emittedNotification.postId = relatedId.toString();
        }
        if (conversationId) {
            emittedNotification.conversationId = conversationId.toString();
        }

        // Push delivery must run before the Redis/local emit returns below,
        // otherwise backgrounded or killed mobile apps would never see it.
        try {
            await sendPushNotification({
                recipientId: recipientIdStr,
                title,
                body: message,
                data: {
                    type: type || 'system',
                    event: event || eventByType[type] || 'system',
                    link: link || '',
                    relatedId: relatedId?.toString?.() || '',
                    conversationId: conversationId?.toString?.() || '',
                },
            });
        } catch (pushErr) {
            console.error('[Notification] Push delivery failed:', pushErr.message);
        }

        // Redis fan-out covers PM2 cluster/worker processes. Direct emit is the
        // fallback for local development where Redis is not configured.
        const published = await publishNotification({
            recipientId: recipientIdStr,
            notification: emittedNotification,
        });

        if (published) {
            console.log(`[Notification] Published to Redis for user ${recipientIdStr}:`, emittedNotification.title);
            return;
        }

        if (!io) {
            console.log('[Notification] No io instance, notification saved but not emitted');
            return;
        }

        const userRoom = `user:${recipientIdStr}`;
        io.to(userRoom).emit('new_notification', emittedNotification);
        console.log(`[Notification] Emitted to room ${userRoom}:`, emittedNotification.title);
    } catch (err) {
        console.error("Notification creation failed:", err);
    }
};
