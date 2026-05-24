import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket({ url, token, roomId, onSignal, onParticipants, onChat }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!url) return;
    const socket = io(url, { query: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('participants', (list) => onParticipants?.(list));
    socket.on('user-joined', (p) => onParticipants?.((prev) => [...(prev||[]), p]));
    socket.on('user-left', (p) => onParticipants?.((prev) => (prev||[]).filter(x => x.socketId !== p.socketId)));

    socket.on('signal', (msg) => onSignal?.(msg));
    socket.on('chat', (m) => onChat?.(m));

    return () => { socket.disconnect(); };
  }, [url, token]);

  function join(roomId, user) {
    socketRef.current?.emit('join-room', { roomId, user });
  }

  function sendSignal(to, data) {
    socketRef.current?.emit('signal', { to, data });
  }

  function sendChat(roomId, message, user) {
    socketRef.current?.emit('chat', { roomId, message, user });
  }

  function leave(roomId) {
    socketRef.current?.emit('leave-room', { roomId });
  }

  return { socketRef, connected, join, sendSignal, sendChat, leave };
}
