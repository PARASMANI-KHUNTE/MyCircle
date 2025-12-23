const path = require('path');
const dotenvPath = path.resolve(__dirname, '.env');
const result = require('dotenv').config({ path: dotenvPath });
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const validateEnv = require('./src/utils/validateEnv');
const errorHandler = require('./src/middleware/errorHandler');

// Validate environment variables before starting
validateEnv();

// Passport config
require('./src/config/passport')(passport);

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Initialize Socket.io
const isProduction = process.env.NODE_ENV === 'production';
const io = new Server(server, {
    cors: {
        origin: isProduction
            ? process.env.CLIENT_URL
            : (process.env.CLIENT_URL || 'http://localhost:5173'),
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible to routes
app.set('io', io);

// Socket.io connection handling with error handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user's personal room
    socket.on('join', (userId) => {
        try {
            if (!userId) {
                console.error('Join event received without userId');
                return;
            }
            socket.join(`user:${userId}`);
            socket.userId = userId; // Store userId on socket
            console.log(`User ${userId} joined their room: user:${userId}`);

            // Broadcast online status
            socket.broadcast.emit('user_online', userId);
        } catch (error) {
            console.error('Error in join event:', error);
        }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
        try {
            // data: { recipientId, conversationId }
            if (data?.recipientId) {
                io.to(`user:${data.recipientId}`).emit('user_typing', {
                    userId: socket.userId,
                    conversationId: data.conversationId
                });
            }
        } catch (error) {
            console.error('Error in typing_start event:', error);
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
            console.error('Error in typing_stop event:', error);
        }
    });

    socket.on('disconnect', () => {
        try {
            console.log('User disconnected:', socket.id);
            if (socket.userId) {
                // Broadcast offline status
                socket.broadcast.emit('user_offline', socket.userId);
            }
        } catch (error) {
            console.error('Error in disconnect event:', error);
        }
    });
});

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            process.env.CLIENT_URL,
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:19006', // Expo web
        ].filter(Boolean);

        // In development, allow all origins
        if (!isProduction) {
            return callback(null, true);
        }

        // In production, check whitelist
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 requests per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
});

app.use('/auth/', authLimiter);

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database Connection
connectDB();

// Passport middleware
app.use(passport.initialize());

// Routes
app.use('/auth', require('./src/routes/authRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/contacts', require('./src/routes/contactRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));

app.get('/', (req, res) => {
    res.send('MyCircle API is running...');
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

