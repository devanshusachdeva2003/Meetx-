let meetingIo = null;

function initMeetingSocket(io) {
  meetingIo = io;

  io.on('connection', (socket) => {
    // Participant joins meeting socket room
    socket.on('meeting:join', ({ roomId, user }) => {
      if (!roomId) return;
      const roomKey = `meeting_${roomId}`;
      socket.join(roomKey);
      socket.data.roomId = roomId;
      socket.data.user = user;

      // Broadcast to room that participant joined
      socket.to(roomKey).emit('meeting:participant_joined', {
        user: user || { id: socket.id, name: 'Guest' },
      });
    });

    // Participant leaves meeting socket room
    socket.on('meeting:leave', ({ roomId }) => {
      if (!roomId) return;
      const roomKey = `meeting_${roomId}`;
      socket.leave(roomKey);
      socket.to(roomKey).emit('meeting:participant_left', {
        user: socket.data.user,
      });
    });

    // Realtime disconnect
    socket.on('disconnect', () => {
      if (socket.data.roomId) {
        socket.to(`meeting_${socket.data.roomId}`).emit('meeting:participant_left', {
          user: socket.data.user,
        });
      }
    });
  });
}

function broadcastMeetingEvent(roomId, eventName, data) {
  if (!meetingIo || !roomId) return;
  meetingIo.to(`meeting_${roomId}`).emit(eventName, data);
}

module.exports = {
  initMeetingSocket,
  broadcastMeetingEvent,
};

