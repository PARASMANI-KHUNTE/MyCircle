const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Post } = require('./models/Post');

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
        service: 'marketplace',
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health/ready', (req, res) => {
    res.json({
        service: 'marketplace',
        status: 'ready',
        timestamp: new Date().toISOString(),
    });
});

// Auth Middleware (Verifies Identity Service Token)
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

// Post Exploration & Discovery (Geospatial & Filtering)
app.get('/api/posts', async (req, res) => {
    try {
        const { type, category, search, longitude, latitude, radius = 50, page = 1, limit = 20 } = req.query;

        const query = { status: 'active' };

        if (type) query.type = type;
        if (category) query.itemCategory = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (longitude !== undefined && latitude !== undefined) {
            query.locationCoords = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)],
                    },
                    $maxDistance: parseInt(radius, 10) * 1000,
                },
            };
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10));

        const total = await Post.countDocuments(query);

        res.json({
            success: true,
            count: posts.length,
            total,
            page: parseInt(page, 10),
            pages: Math.ceil(total / parseInt(limit, 10)),
            data: posts,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Single Post Details
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        res.json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create Post (Emits post.created)
app.post('/api/posts', authenticate, async (req, res) => {
    try {
        const { type, title, description, price, location, coordinates, images, itemCategory } = req.body;

        if (!type || !title || !description || !location || !coordinates) {
            return res.status(400).json({ success: false, message: 'Missing required post fields' });
        }

        const post = await Post.create({
            userId: req.user.id,
            authorSnapshot: {
                displayName: req.user.displayName || 'User',
                avatar: req.user.avatar || '',
            },
            type,
            itemCategory: itemCategory || '',
            title,
            description,
            price: price || 0,
            location,
            locationCoords: {
                type: 'Point',
                coordinates: coordinates,
            },
            images: images || [],
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        res.status(201).json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = app;
