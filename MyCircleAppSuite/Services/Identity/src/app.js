const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const User = require('./models/User');
const { issueToken, verifyToken } = require('./services/tokenService');
const { attachRequestContext, handleServiceError, requireAuth } = require('../../Common/security');
const bcrypt = require('bcryptjs');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(attachRequestContext);

// Operational Probes
app.get('/health/live', (req, res) => {
    res.json({
        service: 'identity',
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health/ready', (req, res) => {
    res.json({
        service: 'identity',
        status: 'ready',
        timestamp: new Date().toISOString(),
    });
});

// Authentication routes
app.post('/auth/register', async (req, res) => {
    try {
        const { displayName, email, password } = req.body;
        if (!displayName || !email || !password) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Display name, email, and password are required',
                requestId: req.requestId,
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Invalid email address format',
                requestId: req.requestId,
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Password must be at least 8 characters long',
                requestId: req.requestId,
            });
        }

        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({
                success: false,
                code: 'CONFLICT',
                message: 'An account with that email already exists',
                requestId: req.requestId,
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            displayName: String(displayName).trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        const token = issueToken(user);
        return res.status(201).json({
            success: true,
            token,
            user: user.toPublicProfile(),
        });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Email and password are required',
                requestId: req.requestId,
            });
        }

        const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                code: 'UNAUTHORIZED',
                message: 'Invalid email or password',
                requestId: req.requestId,
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                code: 'UNAUTHORIZED',
                message: 'Invalid email or password',
                requestId: req.requestId,
            });
        }

        const token = issueToken(user);
        return res.json({
            success: true,
            token,
            user: user.toPublicProfile(),
        });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

// User Profile routes
app.get('/api/user/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                code: 'NOT_FOUND',
                message: 'User profile not found',
                requestId: req.requestId,
            });
        }
        res.json(user.toPublicProfile());
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

app.put('/api/user/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                code: 'NOT_FOUND',
                message: 'User profile not found',
                requestId: req.requestId,
            });
        }

        const allowedUpdates = ['displayName', 'bio', 'phone', 'skills'];
        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });
        await user.save();
        res.json(user.toPublicProfile());
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                code: 'NOT_FOUND',
                message: 'User not found',
                requestId: req.requestId,
            });
        }
        res.json(user.toPublicProfile());
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

module.exports = app;
