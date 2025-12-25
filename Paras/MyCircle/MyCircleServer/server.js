const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env'),
});

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const validateEnv = require('./src/utils/validateEnv');
const errorHandler = require('./src/middleware/errorHandler');

// Validate environment variables BEFORE anything else
validateEnv();

// Passport config
require('./src/config/passport')(passport);

const app = express();
app.set('trust proxy', 1);

const server = http.createServer(app);

/* =======================
   SOCKET.IO CONFIG
======================= */
const isProduction = process.env.NODE_ENV === 'production';

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io available in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join', (userId) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    socket.userId = userId;
    socket.broadcast.emit('user_online', userId);
  });

  socket.on('typing_start', ({ recipientId, conversationId }) => {
    if (!recipientId) return;
    io.to(`user:${recipientId}`).emit('user_typing', {
      userId: socket.userId,
      conversationId,
    });
  });

  socket.on('typing_stop', ({ recipientId, conversationId }) => {
    if (!recipientId) return;
    io.to(`user:${recipientId}`).emit('user_stop_typing', {
      userId: socket.userId,
      conversationId,
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    if (socket.userId) {
      socket.broadcast.emit('user_offline', socket.userId);
    }
  });
});

/* =======================
   CORS
======================= */
app.use(
  cors({
    origin: isProduction
      ? process.env.CLIENT_URL
      : true, // allow all in dev
    credentials: true,
  })
);

/* =======================
   RATE LIMITING
======================= */
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(
  '/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
  })
);

/* =======================
   MIDDLEWARE
======================= */
app.use(express.json());
app.use(passport.initialize());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Database Connection
connectDB();

// Start Background Jobs
const { startCronJobs } = require('./src/utils/cronJobs');
startCronJobs(io);

// Passport middleware
app.use(passport.initialize());

// Routes
app.use('/auth', require('./src/routes/authRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/contacts', require('./src/routes/contactRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));

app.get('/', (_, res) => {
  res.send('MyCircle API is running...');
});

app.get('/api/test', (_, res) => {
  res.json({
    status: 'OK',
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

/* =======================
   ERROR HANDLER
======================= */
app.use(errorHandler);

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB(); // Atlas only
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err.message);
    process.exit(1);
  }
};

startServer();