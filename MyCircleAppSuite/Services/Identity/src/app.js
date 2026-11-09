const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const User = require('./models/User');
const { issueToken, verifyToken } = require('./services/tokenService');
const bcrypt = require('bcryptjs');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Correlation ID / Request Context
app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    res.setHeader('x-request-id', req.requestId);
    next();
});

// Operational health contracts
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
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            displayName,
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        const token = issueToken(user);
        return res.status(201).json({
            success: true,
            token,
            user: user.toPublicProfile(),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user || !user.password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = issueToken(user);
        return res.json({
            success: true,
            token,
            user: user.toPublicProfile(),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// User profile routes
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization required' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.sub);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        req.user = user;
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

app.get('/api/user/profile', authenticate, (req, res) => {
    res.json(req.user.toPublicProfile());
});

app.put('/api/user/profile', authenticate, async (req, res) => {
    try {
        const allowedUpdates = ['displayName', 'bio', 'phone', 'skills'];
        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined) {
                req.user[field] = req.body[field];
            }
        });
        await req.user.save();
        res.json(req.user.toPublicProfile());
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json(user.toPublicProfile());
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = app;
