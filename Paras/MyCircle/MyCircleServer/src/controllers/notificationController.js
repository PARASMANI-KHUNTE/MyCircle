const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
    const notifications = await Notification.find({ recipient: req.user.id })
        .populate('sender', 'displayName avatar')
        .sort({ createdAt: -1 })
        .limit(50); // Limit to last 50
    res.json(notifications);
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

// Helper to create and emit notification (internal use)
exports.createNotification = async (io, { recipient, sender, type, title, message, link, relatedId, conversationId = null }) => {
    try {
        if (!recipient) {
            console.error("[Notification] No recipient provided.");
            return;
        }

        // Safe ID comparison
        const recipientIdStr = recipient._id ? recipient._id.toString() : recipient.toString();
        const senderIdStr = sender?._id ? sender._id.toString() : sender?.toString();

        if (senderIdStr && recipientIdStr === senderIdStr) return; // Don't notify self

        const notification = new Notification({
            recipient,
            sender,
            type,
            title,
            message,
            link,
            relatedId,
            conversationId
        });
        await notification.save();

        if (io) {
            io.to(`user:${recipientIdStr}`).emit('new_notification', notification);
        }
    } catch (err) {
        console.error("Notification creation failed:", err);
    }
};
