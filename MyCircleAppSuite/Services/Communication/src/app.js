const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { Conversation, Message } = require('./models/Chat');
const { attachRequestContext, handleServiceError, requireAuth, getSecureJwtSecret } = require('../../Common/security');

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
app.use(attachRequestContext);

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

// Get User Conversations
app.get('/api/chat/conversations', requireAuth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id,
        }).sort({ lastMessageAt: -1 }).limit(50);

        res.json({ success: true, count: conversations.length, data: conversations });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

// Get Messages in Conversation
app.get('/api/chat/messages/:conversationId', requireAuth, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.conversationId,
            participants: req.user.id,
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                code: 'NOT_FOUND',
                message: 'Conversation not found',
                requestId: req.requestId,
            });
        }

        const messages = await Message.find({
            conversationId: req.params.conversationId,
        }).sort({ createdAt: 1 }).limit(100);

        res.json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

// Send Message
app.post('/api/chat/messages', requireAuth, async (req, res) => {
    try {
        const { recipientId, text, conversationId, postId } = req.body;

        if (!recipientId || !text || !String(text).trim()) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Recipient ID and non-empty text message are required',
                requestId: req.requestId,
            });
        }

        if (String(recipientId) === String(req.user.id)) {
            return res.status(400).json({
                success: false,
                code: 'BAD_REQUEST',
                message: 'Cannot send message to yourself',
                requestId: req.requestId,
            });
        }

        const cleanText = String(text).trim().slice(0, 2000);

        let conv;
        if (conversationId) {
            conv = await Conversation.findOne({
                _id: conversationId,
                participants: req.user.id,
            });
        }

        if (!conv) {
            conv = await Conversation.create({
                participants: [req.user.id, String(recipientId)],
                postId: postId ? String(postId) : null,
                lastMessage: cleanText,
                lastMessageAt: new Date(),
            });
        } else {
            conv.lastMessage = cleanText;
            conv.lastMessageAt = new Date();
            await conv.save();
        }

        const message = await Message.create({
            conversationId: conv._id,
            senderId: req.user.id,
            recipientId: String(recipientId),
            text: cleanText,
        });

        // Broadcast over WebSockets
        io.to(String(recipientId)).emit('message:received', message);

        res.status(201).json({ success: true, data: message });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

// Socket.io Realtime Connection & Authentication
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Authentication required'));
    }

    try {
        const secret = getSecureJwtSecret();
        const decoded = jwt.verify(token, secret);
        socket.userId = decoded.sub;
        next();
    } catch {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    socket.join(socket.userId);
    socket.on('disconnect', () => {
        socket.leave(socket.userId);
    });
});

module.exports = { app, server, io };
