const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Post } = require('./models/Post');
const { attachRequestContext, handleServiceError, requireAuth, parsePagination } = require('../../Common/security');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(attachRequestContext);

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

// Post Exploration & Discovery (Geospatial & Filtering)
app.get('/api/posts', async (req, res) => {
    try {
        const { type, category, search, longitude, latitude, radius = 50 } = req.query;
        const { page, limit, skip } = parsePagination(req.query, 20, 100);

        const query = { status: 'active' };

        if (type) query.type = type;
        if (category) query.itemCategory = category;
        if (search) {
            query.$or = [
                { title: { $regex: String(search), $options: 'i' } },
                { description: { $regex: String(search), $options: 'i' } },
            ];
        }

        if (longitude !== undefined && latitude !== undefined) {
            const parsedLon = parseFloat(longitude);
            const parsedLat = parseFloat(latitude);

            if (Number.isFinite(parsedLon) && Number.isFinite(parsedLat)) {
                query.locationCoords = {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parsedLon, parsedLat],
                        },
                        $maxDistance: Math.min(parseInt(radius, 10) || 50, 500) * 1000,
                    },
                };
            }
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments(query);

        res.json({
            success: true,
            count: posts.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: posts,
        });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

// Single Post Details
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                code: 'NOT_FOUND',
                message: 'Post not found',
                requestId: req.requestId,
            });
        }
        res.json({ success: true, data: post });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

// Create Post (Emits post.created)
app.post('/api/posts', requireAuth, async (req, res) => {
    try {
        const { type, title, description, price, location, coordinates, images, itemCategory } = req.body;

        if (!type || !title || !description || !location || !coordinates) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Missing required post fields: type, title, description, location, coordinates',
                requestId: req.requestId,
            });
        }

        if (!Array.isArray(coordinates) || coordinates.length < 2) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Coordinates must be an array of [longitude, latitude]',
                requestId: req.requestId,
            });
        }

        const post = await Post.create({
            userId: req.user.id,
            authorSnapshot: {
                displayName: req.user.displayName || 'User',
                avatar: req.user.avatar || '',
            },
            type,
            itemCategory: itemCategory || '',
            title: String(title).trim(),
            description: String(description).trim(),
            price: Math.max(0, parseFloat(price) || 0),
            location: String(location).trim(),
            locationCoords: {
                type: 'Point',
                coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])],
            },
            images: Array.isArray(images) ? images.slice(0, 10) : [],
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        res.status(201).json({ success: true, data: post });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

module.exports = app;
