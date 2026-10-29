/**
 * Health Check Routes
 * Provides health status for monitoring and load balancers
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isRedisEnabled, isRedisReady } = require('../utils/queue');

router.get('/', async (req, res) => {
    const services = {
        database: 'error',
        redis: 'unavailable'
    };
    
    // Check MongoDB
    try {
        if (mongoose.connection.readyState === 1) {
            services.database = 'ok';
        }
    } catch (e) {
        services.database = 'error';
    }
    
    // Redis is optional; report the shared queue connection state without opening a new connection.
    services.redis = isRedisEnabled() && isRedisReady() ? 'ok' : 'unavailable';
    
    const status = services.database === 'ok' ? 'ok' : 'degraded';
    
    res.json({
        status,
        timestamp: new Date().toISOString(),
        services,
        version: '1.0.0',
        uptime: process.uptime()
    });
});

router.get('/live', (req, res) => {
    res.json({ status: 'ok' });
});

router.get('/ready', async (req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    
    if (mongoOk) {
        res.json({ status: 'ready' });
    } else {
        res.status(503).json({ status: 'not ready', mongoOk });
    }
});

module.exports = router;