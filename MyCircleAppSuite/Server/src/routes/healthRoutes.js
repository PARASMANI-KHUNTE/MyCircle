/**
 * Health Check Routes
 * Provides health status for monitoring and load balancers
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isRedisEnabled, isRedisReady } = require('../utils/queue');
const { getServiceName } = require('../config/serviceIdentity');
const { checkConfiguredServices } = require('../services/platform/serviceHealth');

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
    const downstream = await checkConfiguredServices();
    services.extracted = downstream.services;

    const status = services.database === 'ok' && downstream.allHealthy ? 'ok' : 'degraded';
    
    res.json({
        status,
        service: getServiceName(),
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
    const downstream = await checkConfiguredServices();
    
    if (mongoOk && downstream.allHealthy) {
        res.json({ status: 'ready', downstream: downstream.services });
    } else {
        res.status(503).json({
            status: 'not ready',
            mongoOk,
            downstream: downstream.services,
        });
    }
});

module.exports = router;