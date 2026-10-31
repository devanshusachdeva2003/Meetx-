// Active board collaborators: boardId -> Map(socketId -> { userId, userName, color })
const boardCollaborators = new Map();

const CURSOR_COLORS = [
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
];

function initWhiteboardSocket(io) {
  const whiteboardNamespace = io.of('/whiteboard');

  whiteboardNamespace.on('connection', (socket) => {
    let currentBoardId = null;
    let currentUser = null;

    // Join board room
    socket.on('join_board', ({ boardId, user }) => {
      currentBoardId = boardId;
      currentUser = user || { id: socket.id, name: 'Guest Artist' };

      const userColor =
        CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];

      socket.join(`board_${boardId}`);

      if (!boardCollaborators.has(boardId)) {
        boardCollaborators.set(boardId, new Map());
      }

      boardCollaborators.get(boardId).set(socket.id, {
        id: currentUser.id || socket.id,
        name: currentUser.name || 'Collaborator',
        color: userColor,
      });

      // Broadcast active collaborators list
      const activeUsers = Array.from(boardCollaborators.get(boardId).values());
      whiteboardNamespace
        .to(`board_${boardId}`)
        .emit('board_users_update', { users: activeUsers });
    });

    // Real-time stroke / shape broadcast
    socket.on('draw_element', ({ boardId, element }) => {
      socket.to(`board_${boardId}`).emit('element_added', { element });
    });

    // Real-time batch sync
    socket.on('sync_elements', ({ boardId, elements }) => {
      socket.to(`board_${boardId}`).emit('elements_synced', { elements });
    });

    // Real-time cursor move
    socket.on('cursor_move', ({ boardId, x, y }) => {
      const userInfo = boardCollaborators.get(boardId)?.get(socket.id);
      if (userInfo) {
        socket.to(`board_${boardId}`).emit('cursor_updated', {
          socketId: socket.id,
          x,
          y,
          name: userInfo.name,
          color: userInfo.color,
        });
      }
    });

    // Clear canvas
    socket.on('clear_canvas', ({ boardId }) => {
      socket.to(`board_${boardId}`).emit('canvas_cleared');
    });

    // Undo action
    socket.on('undo_canvas', ({ boardId }) => {
      socket.to(`board_${boardId}`).emit('canvas_undone');
    });

    // Leave board or disconnect
    const handleLeave = () => {
      if (currentBoardId && boardCollaborators.has(currentBoardId)) {
        const boardMap = boardCollaborators.get(currentBoardId);
        boardMap.delete(socket.id);

        socket.to(`board_${currentBoardId}`).emit('cursor_removed', {
          socketId: socket.id,
        });

        const activeUsers = Array.from(boardMap.values());
        whiteboardNamespace
          .to(`board_${currentBoardId}`)
          .emit('board_users_update', { users: activeUsers });

        if (boardMap.size === 0) {
          boardCollaborators.delete(currentBoardId);
        }
      }
    };

    socket.on('leave_board', handleLeave);
    socket.on('disconnect', handleLeave);
  });
}

module.exports = { initWhiteboardSocket };
