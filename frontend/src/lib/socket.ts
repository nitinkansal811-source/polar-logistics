import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    socket = io(SOCKET_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to Polar Operations Telemetry Server');
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from telemetry server');
    });
  }
  return socket;
};
