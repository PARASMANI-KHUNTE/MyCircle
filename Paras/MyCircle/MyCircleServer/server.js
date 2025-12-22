const path = require('path');
const dotenvPath = path.resolve(__dirname, '.env');
const result = require('dotenv').config({ path: dotenvPath });
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');

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

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user's personal room
    socket.on('join', (userId) => {
        socket.join(`user:${userId}`);
        socket.userId = userId; // Store userId on socket
        console.log(`User ${userId} joined their room: user:${userId}`);

        // Broadcast online status
        socket.broadcast.emit('user_online', userId);
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
        // data: { recipientId, conversationId }
        if (data.recipientId) {
            io.to(`user:${data.recipientId}`).emit('user_typing', {
                userId: socket.userId,
                conversationId: data.conversationId
            });
        }
    });

    socket.on('typing_stop', (data) => {
        if (data.recipientId) {
            io.to(`user:${data.recipientId}`).emit('user_stop_typing', {
                userId: socket.userId,
                conversationId: data.conversationId
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.userId) {
            // Broadcast offline status
            socket.broadcast.emit('user_offline', socket.userId);
        }
    });
});

// Middleware
app.use(cors());
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

app.get('/', (req, res) => {
    res.send('MyCircle API is running...');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
