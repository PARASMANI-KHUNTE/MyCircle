const path = require('path');
const dotenvPath = path.resolve(__dirname, '.env');
const result = require('dotenv').config({ path: dotenvPath });
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const http = require('http');
const crypto = require('crypto');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const pino = require('pino');
const jwt = require('jsonwebtoken');
const connectDB = require('./src/config/db');
require('./src/config/firebase');
const validateEnv = require('./src/utils/validateEnv');
const errorHandler = require('./src/middleware/errorHandler');
const { closeQueueConnection } = require('./src/utils/queue');
const { onNotification } = require('./src/utils/notificationBus');
const { onModerationUpdate } = require('./src/utils/moderationBus');
const { createRateLimiters } = require('./src/utils/rateLimiters');
const { registerSocketHandlers } = require('./src/socket/handlers');

validateEnv();

require('./src/config/passport')(passport);

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

const logger = isProduction 
    ? pino({ level: 'info' })
    : pino({ level: 'debug', transport: { target: 'pino-pretty' } });

app.set('logger', logger);
global.appLogger = logger;

const rawCorsOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || '').toString();
const corsOrigins = rawCorsOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: isProduction 
            ? corsOrigins 
            : (process.env.CLIENT_URL_DEV || 'http://localhost:5173'),
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
});

app.set('io', io);

// Fan out notifications published by other cluster workers/processes.
onNotification(({ recipientId, notification }) => {
    io.to(`user:${recipientId}`).emit('new_notification', notification);
    logger.info({ recipientId, title: notification?.title }, 'Delivered cross-process notification');
});

// Moderation results produced by BullMQ workers are relayed to connected clients.
onModerationUpdate(({ postId, moderationStatus }) => {
    io.emit('post_moderation_update', { postId, moderationStatus });
    logger.info({ postId, moderationStatus }, 'Broadcast post moderation update');
});

io.use((socket, next) => {
    try {
        const handshakeToken = socket.handshake.auth?.token;
        const headerToken = socket.handshake.headers['x-auth-token'];
        const bearerToken = socket.handshake.headers.authorization?.startsWith('Bearer ')
            ? socket.handshake.headers.authorization.slice(7)
            : null;
        const token = handshakeToken || headerToken || bearerToken;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded.user;
        return next();
    } catch (error) {
        return next(new Error('Authentication failed'));
    }
});

registerSocketHandlers(io, { logger });

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
}));

app.use(compression());

const corsOptions = {
    origin: isProduction
        ? (corsOrigins.length ? corsOrigins : (process.env.CLIENT_URL || 'https://mycircle.com'))
        : true,
    credentials: true
};

app.use(cors(corsOptions));

if (isProduction) {
    const { apiLimiter, authLimiter, aiLimiter } = createRateLimiters();

    app.use('/api/', apiLimiter);
    app.use('/auth/', authLimiter);
    app.use('/api/auth/', authLimiter);
    app.use('/api/ai/', aiLimiter);

    logger.info(
        process.env.REDIS_URL
            ? 'Rate limiting enabled with shared Redis store'
            : 'Rate limiting enabled (in-memory)'
    );
} else {
    logger.info('Rate limiting disabled (development mode)');
}

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
    const requestId = req.header('x-request-id') || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    req.log = logger.child({
        requestId,
        method: req.method,
        path: req.originalUrl
    });

    req.startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        req.log.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.id,
        }, 'Request completed');
    });
    next();
});

connectDB();

const { startCronJobs } = require('./src/utils/cronJobs');
startCronJobs(io);

app.use(passport.initialize());

app.use('/', require('./src/routes/healthRoutes'));
app.use('/auth', require('./src/routes/authRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/contacts', require('./src/routes/contactRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/support', require('./src/routes/supportRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

app.get('/health', async (req, res) => {
    const healthcheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            mongodb: 'unknown',
            firebase: 'unknown',
        }
    };
    
    try {
        const mongoose = require('mongoose');
        healthcheck.services.mongodb = mongoose.connection.readyState === 1 ? 'ok' : 'error';
    } catch (e) {
        healthcheck.services.mongodb = 'error';
    }
    
    try {
        const { admin } = require('./src/config/firebase');
        if (admin) healthcheck.services.firebase = 'ok';
    } catch (e) {
        healthcheck.services.firebase = 'error';
    }
    
    const allHealthy = Object.values(healthcheck.services).every(s => s === 'ok');
    healthcheck.status = allHealthy ? 'ok' : 'degraded';
    
    res.status(allHealthy ? 200 : 503).json(healthcheck);
});

app.get('/post/:id', (req, res) => {
    const clientUrl = isProduction
        ? process.env.CLIENT_URL
        : process.env.CLIENT_URL_DEV;
    if (!clientUrl) {
        return res.status(500).json({ msg: 'Client URL not configured' });
    }
    res.redirect(`${clientUrl}/post/${req.params.id}`);
});

app.get('/', (req, res) => {
    res.send('MyCircle API is running...');
});

app.get('/api/test', (req, res) => {
    res.json({
        message: 'MyCircle API test endpoint is working!',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 30000;

const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, starting graceful shutdown`);
    const forcedShutdownTimer = setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);

    server.close(async () => {
        logger.info('HTTP server closed');
        const mongoose = require('mongoose');

        await closeQueueConnection();

        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            clearTimeout(forcedShutdownTimer);
            process.exit(0);
        });
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started');
});

module.exports = { app, server, io };
