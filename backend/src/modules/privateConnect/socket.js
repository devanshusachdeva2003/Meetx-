const jwt = require('jsonwebtoken');
const PrivateConversation = require('./privateConversation.model');
const PrivateMessage = require('./privateMessage.model');

// Store online users: userId -> Set of socket IDs
const onlineUsers = new Map();
let ioInstance = null;

function initPrivateConnectSocket(io) {
  ioInstance = io;

  // Socket authentication middleware
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      (socket.handshake.headers.authorization &&
        socket.handshake.headers.authorization.split(' ')[1]);

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret'
      );
      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    if (!userId) return;

    // Track online user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal user room for direct notifications
    socket.join(`user_${userId}`);

    // Broadcast user online status
    io.emit('user_status', { userId, status: 'online' });

    // Client requests online status of a specific user or list
    socket.on('get_online_status', (userIds, callback) => {
      if (typeof callback === 'function') {
        const statuses = {};
        if (Array.isArray(userIds)) {
          userIds.forEach((id) => {
            statuses[id] = onlineUsers.has(id) && onlineUsers.get(id).size > 0;
          });
        }
        callback(statuses);
      }
    });

    // Join conversation room
    socket.on('join_conversation', async (conversationId) => {
      try {
        const conversation = await PrivateConversation.findById(conversationId);
        if (!conversation) return;

        // Security check: must be a participant
        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );
        if (isParticipant) {
          socket.join(`conversation_${conversationId}`);
        }
      } catch (err) {
        console.error('Error joining conversation:', err);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // Typing indicators
    socket.on('typing_start', ({ conversationId, userName }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        userName,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      if (onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast user offline status
          io.emit('user_status', { userId, status: 'offline' });
        }
      }
    });
  });

  return io;
}

function getIo() {
  return ioInstance;
}

function isUserOnline(userId) {
  return onlineUsers.has(userId.toString()) && onlineUsers.get(userId.toString()).size > 0;
}

module.exports = {
  initPrivateConnectSocket,
  getIo,
  isUserOnline,
};
