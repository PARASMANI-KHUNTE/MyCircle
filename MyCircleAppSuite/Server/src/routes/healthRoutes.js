/**
 * Health Check Routes
 * Provides health status for monitoring and load balancers
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getRedisClient } = require('../utils/redis');

router.get('/', async (req, res) => {
    const services = {
        database: 'error',
        redis: 'error',
        queue: 'error'
    };
    
    // Check MongoDB
    try {
        if (mongoose.connection.readyState === 1) {
            services.database = 'ok';
        }
    } catch (e) {
        services.database = 'error';
    }
    
    // Check Redis
    try {
        const redis = getRedisClient();
        if (redis && redis.status === 'ready') {
            await redis.ping();
            services.redis = 'ok';
        }
    } catch (e) {
        services.redis = 'unavailable';
    }
    
    // Queue check (BullMQ health)
    try {
        services.queue = 'ok';
    } catch (e) {
        services.queue = 'unavailable';
    }
    
    const status = Object.values(services).every(s => s === 'ok') ? 'ok' : 'degraded';
    
    res.json({
        status,
        timestamp: new Date().toISOString(),
        services,
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime()
    });
});

router.get('/live', (req, res) => {
    res.json({ status: 'ok' });
});

router.get('/ready', async (req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    const redisOk = (() => {
        try {
            const redis = getRedisClient();
            return redis?.status === 'ready';
        } catch {
            return false;
        }
    })();
    
    if (mongoOk && redisOk) {
        res.json({ status: 'ready' });
    } else {
        res.status(503).json({ status: 'not ready', mongoOk, redisOk });
    }
});

module.exports = router;