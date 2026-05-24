import { io } from 'socket.io-client';

export function createSocket(url, token) {
  return io(url, { query: { token }, transports: ['websocket'] });
}
