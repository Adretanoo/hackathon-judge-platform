/**
 * @file web/src/shared/lib/socket.ts
 * @description Centralized Socket.io client initialization.
 */

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      auth: (cb) => {
        // dynamically inject token on reconnects too
        cb({ token: localStorage.getItem('accessToken') });
      },
      transports: ['websocket', 'polling'],
      autoConnect: false, // We'll connect manually when AuthProvider says user is logged in
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket!.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });
  }
  return socket;
}

export function connectSocket() {
  getSocket().connect();
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
}
