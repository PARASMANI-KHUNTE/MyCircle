const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Notification } = require('./models/Notification');
const { attachRequestContext, handleServiceError, requireAuth, parsePagination } = require('../../Common/security');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(attachRequestContext);

// Operational Probes
app.get('/health/live', (req, res) => {
    res.json({
        service: 'notifications',
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health/ready', (req, res) => {
    res.json({
        service: 'notifications',
        status: 'ready',
        timestamp: new Date().toISOString(),
    });
});

// Get User Notifications
app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query, 30, 100);

        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const unreadCount = await Notification.countDocuments({
            userId: req.user.id,
            read: false,
        });

        res.json({
            success: true,
            unreadCount,
            page,
            limit,
            data: notifications,
        });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

// Mark Single Notification as Read
app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                code: 'NOT_FOUND',
                message: 'Notification not found',
                requestId: req.requestId,
            });
        }

        res.json({ success: true, data: notification });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

// Mark All Notifications as Read
app.put('/api/notifications/read-all', requireAuth, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, read: false },
            { read: true, readAt: new Date() }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read',
            requestId: req.requestId,
        });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

module.exports = app;
