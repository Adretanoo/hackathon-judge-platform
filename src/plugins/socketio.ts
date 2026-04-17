/**
 * @file src/plugins/socketio.ts
 * @description Registers Socket.io server with Redis adapter for horizontal scaling.
 */

import fp from 'fastify-plugin';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config';

export default fp(async (app) => {
  const pubClient = app.redis;

  let ioAdapter: any = undefined;

  // Only use Redis adapter if the client is actually connected
  if (pubClient.status === 'ready') {
    try {
      const subClient = pubClient.duplicate();
      subClient.on('error', () => {}); // suppress sub client errors
      // Wait for subClient to connect since enableOfflineQueue is false
      await subClient.connect().catch(() => {});
      
      if (subClient.status === 'ready') {
        ioAdapter = createAdapter(pubClient, subClient);
        app.addHook('onClose', async () => {
          try { await subClient.quit(); } catch { /* ignore */ }
        });
      } else {
        app.log.warn('⚠️  Redis subClient failed to connect — Socket.IO using in-memory');
      }
    } catch {
      app.log.warn('⚠️  Could not create Redis adapter for Socket.IO — using in-memory');
    }
  } else {
    app.log.warn('⚠️  Redis not connected — Socket.IO using in-memory adapter (single-server mode)');
  }

  let io: Server;
  try {
    io = new Server(app.server, {
      cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
      },
      ...(ioAdapter ? { adapter: ioAdapter } : {}),
      transports: ['websocket', 'polling'],
    });
  } catch (err: any) {
    app.log.warn(`⚠️  Socket.IO RedisAdapter failed (${err.message}). Falling back to in-memory adapter.`);
    io = new Server(app.server, {
      cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });
  }

  // Middleware to authenticate socket connections via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Unauthorized: No token provided'));
      }
      const decoded = app.jwt.verify(token) as any;
      socket.data.userId = decoded.sub;
      socket.data.role = decoded.role;
      socket.data.fullName = decoded.fullName;
      next();
    } catch (err) {
      next(new Error('Unauthorized: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);
    app.log.debug(`Socket connected: ${userId}`);

    socket.on('join:hackathon', (hackathonId: string) => {
      socket.join(`hackathon:${hackathonId}`);
    });

    socket.on('leave:hackathon', (hackathonId: string) => {
      socket.leave(`hackathon:${hackathonId}`);
    });

    socket.on('disconnect', () => {
      app.log.debug(`Socket disconnected: ${userId}`);
    });
  });

  app.decorate('io', io);

  app.addHook('onClose', async (instance) => {
    instance.io.close();
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}
