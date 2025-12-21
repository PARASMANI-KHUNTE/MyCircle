const path = require('path');
const dotenvPath = path.resolve(__dirname, '.env');
const result = require('dotenv').config({ path: dotenvPath, debug: true });
console.log("Dotenv loading from:", dotenvPath);
if (result.error) {
    console.error("Dotenv Error:", result.error);
} else {
    console.log("Dotenv Parsed:", result.parsed);
}
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');

// Passport config
require('./src/config/passport')(passport);

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
        console.log(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
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
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/contacts', require('./src/routes/contactRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));

app.get('/', (req, res) => {
    res.send('MyCircle API is running...');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
