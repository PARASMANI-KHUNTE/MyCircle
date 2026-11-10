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
const { serviceContracts } = require('../config/serviceContracts');

const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
};

// Map internal check results to the status labels the admin UI understands
const toUiStatus = (status) => {
    switch (status) {
        case 'ok':
            return 'healthy';
        case 'error':
        case 'timeout':
            return 'down';
        default:
            return 'unknown';
    }
};

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

// Per-service health cards for the admin dashboard.
// Shape: { services: [{ name, description, status, latency, uptime, lastCheck }] }
router.get('/services', async (req, res) => {
    const startedAt = Date.now();
    const lastCheck = new Date().toISOString();
    const uptime = formatUptime(process.uptime());

    const mongoOk = mongoose.connection.readyState === 1;
    const redisOk = isRedisEnabled() && isRedisReady();

    let firebaseOk = false;
    try {
        const { admin } = require('../config/firebase');
        firebaseOk = Boolean(admin && Array.isArray(admin.apps) && admin.apps.length > 0);
    } catch (e) {
        firebaseOk = false;
    }

    const downstream = await checkConfiguredServices();

    const services = [
        {
            name: 'database',
            description: 'MongoDB primary datastore',
            status: mongoOk ? 'healthy' : 'down',
            latency: Date.now() - startedAt,
            uptime,
            lastCheck,
        },
        {
            name: 'redis',
            description: 'Redis job queue and cache',
            status: redisOk ? 'healthy' : 'unknown',
            latency: Date.now() - startedAt,
            uptime,
            lastCheck,
        },
        {
            name: 'firebase',
            description: 'Firebase push notifications',
            status: firebaseOk ? 'healthy' : 'down',
            latency: Date.now() - startedAt,
            uptime,
            lastCheck,
        },
        ...Object.entries(downstream.services).map(([name, result]) => ({
            name,
            description: serviceContracts[name]?.persistence || `${name} service`,
            status: toUiStatus(result.status),
            httpStatus: result.httpStatus,
            uptime,
            lastCheck,
        })),
    ];

    res.json({ services });
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