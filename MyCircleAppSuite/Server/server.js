const path = require('path');
const dotenvPath = path.resolve(__dirname, '.env');
const result = require('dotenv').config({ path: dotenvPath });
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const pino = require('pino');
const connectDB = require('./src/config/db');
require('./src/config/firebase');
const validateEnv = require('./src/utils/validateEnv');
const errorHandler = require('./src/middleware/errorHandler');

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

const rawCorsOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || '').toString();
const corsOrigins = rawCorsOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: isProduction ? corsOrigins : true,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'User connected');

    socket.on('join', (userId) => {
        try {
            if (!userId) {
                logger.warn({ socketId: socket.id }, 'Join event without userId');
                return;
            }
            socket.join(`user:${userId}`);
            socket.userId = userId;
            logger.info({ userId, room: `user:${userId}` }, 'User joined room');
            socket.broadcast.emit('user_online', userId);
        } catch (error) {
            logger.error({ error: error.message }, 'Error in join event');
        }
    });

    socket.on('join_conversation', (conversationId) => {
        try {
            if (conversationId) {
                socket.join(`conversation:${conversationId}`);
                logger.debug({ conversationId }, 'User joined conversation');
            }
        } catch (error) {
            logger.error({ error: error.message }, 'Error in join_conversation');
        }
    });

    socket.on('leave_conversation', (conversationId) => {
        try {
            if (conversationId) {
                socket.leave(`conversation:${conversationId}`);
            }
        } catch (error) {
            logger.error({ error: error.message }, 'Error in leave_conversation');
        }
    });

    socket.on('typing_start', (data) => {
        try {
            if (data?.recipientId) {
                io.to(`user:${data.recipientId}`).emit('user_typing', {
                    userId: socket.userId,
                    conversationId: data.conversationId
                });
            }
        } catch (error) {
            logger.error({ error: error.message }, 'Error in typing_start');
        }
    });

    socket.on('typing_stop', (data) => {
        try {
            if (data?.recipientId) {
                io.to(`user:${data.recipientId}`).emit('user_stop_typing', {
                    userId: socket.userId,
                    conversationId: data.conversationId
                });
            }
        } catch (error) {
            logger.error({ error: error.message }, 'Error in typing_stop');
        }
    });

    socket.on('disconnect', () => {
        try {
            logger.info({ socketId: socket.id }, 'User disconnected');
            if (socket.userId) {
                socket.broadcast.emit('user_offline', socket.userId);
            }
        } catch (error) {
            logger.error({ error: error.message }, 'Error in disconnect');
        }
    });
});

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
        ? (process.env.CLIENT_URL || 'https://mycircle.com')
        : true,
    credentials: true
};

app.use(cors(corsOptions));

if (isProduction) {
    const rateLimitOptions = {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    };
    
    if (process.env.REDIS_URL) {
        const RedisStore = require('rate-limit-redis');
        const Redis = require('ioredis');
        const redis = new Redis(process.env.REDIS_URL);
        
        rateLimitOptions.store = new RedisStore({
            sendCommand: (...args) => redis.call(...args),
        });
        logger.info('Using Redis for rate limiting');
    }
    
    const limiter = rateLimit(rateLimitOptions);
    app.use('/api/', limiter);

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many authentication attempts, please try again later.',
    });
    app.use('/auth/', authLimiter);
    logger.info('Rate limiting enabled');
} else {
    logger.info('Rate limiting disabled (development mode)');
}

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
    req.startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        logger.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
        }, 'Request completed');
    });
    next();
});

connectDB();

const { startCronJobs } = require('./src/utils/cronJobs');
startCronJobs(io);

app.use(passport.initialize());

app.use('/auth', require('./src/routes/authRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/contacts', require('./src/routes/contactRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));

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

const gracefulShutdown = (signal) => {
    logger.info(`${signal} received, starting graceful shutdown`);
    server.close(() => {
        logger.info('HTTP server closed');
        const mongoose = require('mongoose');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
    
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started');
});

module.exports = { app, server, io };