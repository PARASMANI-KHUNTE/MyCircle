const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { ContactRequest } = require('./models/ContactRequest');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Tracing & Request Context
app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    res.setHeader('x-request-id', req.requestId);
    next();
});

// Operational Probes
app.get('/health/live', (req, res) => {
    res.json({
        service: 'contact',
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health/ready', (req, res) => {
    res.json({
        service: 'contact',
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

// Create Contact Request
app.post('/api/contacts/request', authenticate, async (req, res) => {
    try {
        const { postId, recipientId, message } = req.body;

        if (!postId || !recipientId) {
            return res.status(400).json({ success: false, message: 'Post ID and Recipient ID are required' });
        }

        if (recipientId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot send contact request to yourself' });
        }

        const existing = await ContactRequest.findOne({
            postId,
            requesterId: req.user.id,
            recipientId,
            status: { $in: ['pending', 'accepted', 'approved'] },
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'A request already exists for this post' });
        }

        const request = await ContactRequest.create({
            postId,
            requesterId: req.user.id,
            recipientId,
            message: message || '',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
        });

        res.status(201).json({ success: true, data: request });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get User Contact Requests (Incoming & Outgoing)
app.get('/api/contacts/requests', authenticate, async (req, res) => {
    try {
        const { type = 'all' } = req.query;
        let query = {};

        if (type === 'incoming') {
            query.recipientId = req.user.id;
        } else if (type === 'outgoing') {
            query.requesterId = req.user.id;
        } else {
            query.$or = [{ requesterId: req.user.id }, { recipientId: req.user.id }];
        }

        const requests = await ContactRequest.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Respond to Request (Accept / Reject)
app.put('/api/contacts/requests/:id/respond', authenticate, async (req, res) => {
    try {
        const { action } = req.body; // 'accept' or 'reject'
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        const request = await ContactRequest.findOne({
            _id: req.params.id,
            recipientId: req.user.id,
            status: 'pending',
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Pending request not found' });
        }

        if (action === 'accept') {
            request.status = 'accepted';
            request.acceptedAt = new Date();
        } else {
            request.status = 'rejected';
        }

        await request.save();

        res.json({ success: true, data: request });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = app;
