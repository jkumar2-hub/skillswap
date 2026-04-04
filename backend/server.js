require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { init } = require('./db/database');
const { JWT_SECRET } = require('./middleware/auth');
const socketManager = require('./socketManager');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'https://skillswap-seven-sigma.vercel.app',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Share io instance with routes
socketManager.init(io);

const PORT = process.env.PORT || 5000;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/exchanges', require('./routes/exchanges'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// ── Socket.io ──
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    socket.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { next(new Error('Invalid token')); }
});

io.on('connection', (socket) => {
  const userId = String(socket.user.id);
  socketManager.registerSocket(userId, socket.id);
  console.log(`🔌 ${socket.user.name} connected`);

  const emitToUser = (targetId, event, data) =>
    socketManager.emitToUser(targetId, event, data);

  // ── WebRTC signaling ──
  socket.on('call:initiate', ({ targetUserId, callType, callerName }) =>
    emitToUser(targetUserId, 'call:incoming', {
      callerId: socket.user.id,
      callerName: callerName || socket.user.name,
      callType,
    }));

  socket.on('call:answer', ({ callerId, accepted }) =>
    emitToUser(callerId, 'call:answered', { accepted, answererId: socket.user.id }));

  socket.on('webrtc:offer', ({ targetUserId, offer }) =>
    emitToUser(targetUserId, 'webrtc:offer', { offer, callerId: socket.user.id }));

  socket.on('webrtc:answer', ({ targetUserId, answer }) =>
    emitToUser(targetUserId, 'webrtc:answer', { answer, answererId: socket.user.id }));

  socket.on('webrtc:ice-candidate', ({ targetUserId, candidate }) =>
    emitToUser(targetUserId, 'webrtc:ice-candidate', { candidate, senderId: socket.user.id }));

  socket.on('call:screenshare', ({ targetUserId, active }) =>
    emitToUser(targetUserId, 'call:screenshare', { senderId: socket.user.id, active }));

  socket.on('call:end', ({ targetUserId }) =>
    emitToUser(targetUserId, 'call:ended', { endedBy: socket.user.id }));

  // ── Typing indicators ──
  socket.on('typing:start', ({ targetUserId }) =>
    emitToUser(targetUserId, 'typing:start', { senderId: socket.user.id }));

  socket.on('typing:stop', ({ targetUserId }) =>
    emitToUser(targetUserId, 'typing:stop', { senderId: socket.user.id }));

  socket.on('disconnect', () => {
    socketManager.removeSocket(userId, socket.id);
    console.log(`🔌 ${socket.user.name} disconnected`);
  });
});

init().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebRTC signaling + real-time messages active`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});
