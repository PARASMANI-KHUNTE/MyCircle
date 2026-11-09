const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Notification } = require('./models/Notification');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Correlation ID & Tracing
app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    res.setHeader('x-request-id', req.requestId);
    next();
});

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

// Auth Middleware (Verifies Identity Token)
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization required' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'identity_service_default_secret_key_12345';
        const decoded = jwt.verify(token, secret);
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            displayName: decoded.displayName,
        };
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// Get User Notifications
app.get('/api/notifications', authenticate, async (req, res) => {
    try {
        const { limit = 30, page = 1 } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10));

        const unreadCount = await Notification.countDocuments({
            userId: req.user.id,
            read: false,
        });

        res.json({
            success: true,
            unreadCount,
            data: notifications,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Mark Single Notification as Read
app.put('/api/notifications/:id/read', authenticate, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, data: notification });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Mark All Notifications as Read
app.put('/api/notifications/read-all', authenticate, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, read: false },
            { read: true, readAt: new Date() }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = app;
