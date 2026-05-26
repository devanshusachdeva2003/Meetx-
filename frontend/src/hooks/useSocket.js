import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket({ url, token, roomId, onSignal, onParticipants, onUserJoined, onUserLeft, onChat }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!url) return;
    const socket = io(url, { query: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleParticipants = (list) => {
      console.debug('[SOCKET] participants', list);
      onParticipants?.(list);
    };
    const handleUserJoined = (p) => {
      console.debug('[SOCKET] user-joined', p);
      onUserJoined?.(p);
    };
    const handleUserLeft = (p) => {
      console.debug('[SOCKET] user-left', p);
      onUserLeft?.(p);
    };
    const handleSignal = (msg) => {
      console.debug('[SOCKET] signal in', msg);
      onSignal?.(msg);
    };
    const handleChat = (m) => onChat?.(m);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('participants', handleParticipants);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('signal', handleSignal);
    socket.on('chat', handleChat);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('participants', handleParticipants);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('signal', handleSignal);
      socket.off('chat', handleChat);
      socket.disconnect();
    };
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
