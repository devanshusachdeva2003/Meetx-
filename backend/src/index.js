require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meetings');
const calendarRoutes = require('./routes/calendar');
const { verify } = require('./utils/jwt');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/calendar', calendarRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});

// Simple in-memory room participants map for signaling metadata
const rooms = new Map();

io.on('connection', (socket) => {
  // optional: token validation
  const { token } = socket.handshake.query;
  try {
    if (token && process.env.JWT_SECRET) {
      const payload = verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.sub, name: payload.name };
    }
  } catch (err) {
    // ignore
  }

  socket.on('join-room', ({ roomId, user }) => {
    socket.join(roomId);
    const list = rooms.get(roomId) || [];
    list.push({ socketId: socket.id, user });
    rooms.set(roomId, list);
    // notify others
    socket.to(roomId).emit('user-joined', { socketId: socket.id, user });
    // send existing participants to the joining socket
    const others = list.filter((p) => p.socketId !== socket.id);
    socket.emit('participants', others);
  });

  socket.on('signal', ({ to, data }) => {
    io.to(to).emit('signal', { from: socket.id, data });
  });

  socket.on('chat', ({ roomId, message, user }) => {
    io.to(roomId).emit('chat', { message, user, at: Date.now() });
  });

  socket.on('leave-room', ({ roomId }) => {
    socket.leave(roomId);
    const list = rooms.get(roomId) || [];
    rooms.set(roomId, list.filter((p) => p.socketId !== socket.id));
    socket.to(roomId).emit('user-left', { socketId: socket.id });
  });

  socket.on('disconnect', () => {
    // remove from all rooms
    for (const [roomId, list] of rooms) {
      const found = list.find((p) => p.socketId === socket.id);
      if (found) {
        rooms.set(roomId, list.filter((p) => p.socketId !== socket.id));
        socket.to(roomId).emit('user-left', { socketId: socket.id, user: found.user });
      }
    }
  });
});

async function start() {
  const port = process.env.PORT || 4000;
  if (process.env.MONGODB_URI) {
    try { await connectDB(process.env.MONGODB_URI); } catch (err) { console.error(err); }
  }
  server.listen(port, () => console.log(`Server listening on ${port}`));
}

start();
