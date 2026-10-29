
const dns = require('node:dns');

// Use explicit DNS resolvers for MongoDB Atlas SRV lookups.
// Keep this before importing modules that may connect to MongoDB.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

dotenv.config();

const User = require('./models/User');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRouts');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const friendRoutes = require('./routes/friendRoutes');

const app = express();
const server = http.createServer(app);

const frontendOrigin = process.env.FRONTEND_URL
  ? new URL(process.env.FRONTEND_URL).origin
  : null;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  ...(frontendOrigin ? [frontendOrigin] : []),
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const onlineSocketsByUser = new Map();

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      'emailVerified tokenVersion'
    );

    if (
      !user ||
      !user.emailVerified ||
      (decoded.tokenVersion ?? 0) !== user.tokenVersion
    ) {
      next(new Error('Not authorized'));
      return;
    }

    socket.data.userId = user._id.toString();
    next();
  } catch (error) {
    next(error);
  }
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.set('io', io);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SkillDuels API is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  const userId = socket.data.userId;

  if (userId) {
    socket.join(`user:${userId}`);

    const userSockets = onlineSocketsByUser.get(userId) || new Set();
    userSockets.add(socket.id);
    onlineSocketsByUser.set(userId, userSockets);

    io.emit('presence_updated', {
      userId,
      online: true,
    });
  }

  socket.emit('presence_snapshot', {
    userIds: Array.from(onlineSocketsByUser.keys()),
  });

  socket.on('request_presence_snapshot', () => {
    socket.emit('presence_snapshot', {
      userIds: Array.from(onlineSocketsByUser.keys()),
    });
  });

  socket.on('join_match_room', (roomCode) => {
    socket.join(roomCode);
    console.log(`User ${socket.id} joined match room: ${roomCode}`);
  });

  socket.on('submit_live_answer', (data) => {
    const { roomCode, score, playerId } = data;

    socket.to(roomCode).emit('opponent_score_update', {
      playerId,
      score,
    });
  });

  socket.on('disconnect', () => {
    if (userId) {
      const userSockets = onlineSocketsByUser.get(userId);

      userSockets?.delete(socket.id);

      if (userSockets?.size === 0) {
        onlineSocketsByUser.delete(userId);

        io.emit('presence_updated', {
          userId,
          online: false,
        });
      }
    }

    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });
