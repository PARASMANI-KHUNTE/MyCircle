const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { ContactRequest } = require('./models/ContactRequest');
const { attachRequestContext, handleServiceError, requireAuth } = require('../../Common/security');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(attachRequestContext);

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

// Create Contact Request
app.post('/api/contacts/request', requireAuth, async (req, res) => {
    try {
        const { postId, recipientId, message } = req.body;

        if (!postId || !recipientId) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Post ID and Recipient ID are required',
                requestId: req.requestId,
            });
        }

        if (String(recipientId) === String(req.user.id)) {
            return res.status(400).json({
                success: false,
                code: 'BAD_REQUEST',
                message: 'Cannot send contact request to yourself',
                requestId: req.requestId,
            });
        }

        const existing = await ContactRequest.findOne({
            postId: String(postId),
            requesterId: req.user.id,
            recipientId: String(recipientId),
            status: { $in: ['pending', 'accepted', 'approved'] },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                code: 'CONFLICT',
                message: 'An active contact request already exists for this post',
                requestId: req.requestId,
            });
        }

        const request = await ContactRequest.create({
            postId: String(postId),
            requesterId: req.user.id,
            recipientId: String(recipientId),
            message: message ? String(message).slice(0, 500) : '',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
        });

        res.status(201).json({ success: true, data: request });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

// Get User Contact Requests
app.get('/api/contacts/requests', requireAuth, async (req, res) => {
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
        res.json({ success: true, count: requests.length, data: requests });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

// Respond to Request (Accept / Reject)
app.put('/api/contacts/requests/:id/respond', requireAuth, async (req, res) => {
    try {
        const { action } = req.body;
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: "Action must be either 'accept' or 'reject'",
                requestId: req.requestId,
            });
        }

        const request = await ContactRequest.findOne({
            _id: req.params.id,
            recipientId: req.user.id,
            status: 'pending',
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                code: 'NOT_FOUND',
                message: 'Pending request not found',
                requestId: req.requestId,
            });
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
        return handleServiceError(res, err, req);
    }
});

module.exports = app;
