/**
 * @file web/src/app/providers/socket-provider.tsx
 * @description Provides the Socket instance to the React tree. Automatically connects 
 * when the user logs in, and disconnects when they log out.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '@/shared/lib/socket';
import { useAuth } from './auth-provider';
import type { Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket] = useState(() => getSocket());

  useEffect(() => {
    // If we have an authenticated user, connect to real-time events
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      // Cleanup on unmount, primarily for dev HMR
      disconnectSocket();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

/** Hook to access the global socket instance */
export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return ctx;
};
