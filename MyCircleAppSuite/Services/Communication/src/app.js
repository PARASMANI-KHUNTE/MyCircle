const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { Conversation, Message } = require('./models/Chat');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Correlation ID & Tracing
app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    res.setHeader('x-request-id', req.requestId);
    next();
});

// Operational Probes
app.get('/health/live', (req, res) => {
    res.json({
        service: 'communication',
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health/ready', (req, res) => {
    res.json({
        service: 'communication',
        status: 'ready',
        timestamp: new Date().toISOString(),
    });
});

// Auth Middleware (Verifies Identity Service Token)
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization required' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'identity_service_default_secret_key_12345';
        const decoded = jwt.verify(token, secret);
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            displayName: decoded.displayName,
        };
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// Get User Conversations
app.get('/api/chat/conversations', authenticate, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id,
        }).sort({ lastMessageAt: -1 });

        res.json({ success: true, data: conversations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get Messages in Conversation
app.get('/api/chat/messages/:conversationId', authenticate, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.conversationId,
            participants: req.user.id,
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const messages = await Message.find({
            conversationId: req.params.conversationId,
        }).sort({ createdAt: 1 }).limit(100);

        res.json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Send Message
app.post('/api/chat/messages', authenticate, async (req, res) => {
    try {
        const { recipientId, text, conversationId, postId } = req.body;

        if (!recipientId || !text) {
            return res.status(400).json({ success: false, message: 'Recipient and text are required' });
        }

        let conv;
        if (conversationId) {
            conv = await Conversation.findOne({
                _id: conversationId,
                participants: req.user.id,
            });
        }

        if (!conv) {
            conv = await Conversation.create({
                participants: [req.user.id, recipientId],
                postId: postId || null,
                lastMessage: text,
                lastMessageAt: new Date(),
            });
        } else {
            conv.lastMessage = text;
            conv.lastMessageAt = new Date();
            await conv.save();
        }

        const message = await Message.create({
            conversationId: conv._id,
            senderId: req.user.id,
            recipientId,
            text,
        });

        // Broadcast over WebSockets
        io.to(recipientId).emit('message:received', message);

        res.status(201).json({ success: true, data: message });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Socket.io Realtime Connection & Authentication
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Authentication required'));
    }

    try {
        const secret = process.env.JWT_SECRET || 'identity_service_default_secret_key_12345';
        const decoded = jwt.verify(token, secret);
        socket.userId = decoded.sub;
        next();
    } catch {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    socket.join(socket.userId);
    console.log(`[Socket] User ${socket.userId} joined room`);

    socket.on('disconnect', () => {
        socket.leave(socket.userId);
    });
});

module.exports = { app, server, io };
