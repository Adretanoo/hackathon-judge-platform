/**
 * @file src/plugins/socketio.ts
 * @description Registers Socket.io server with Redis adapter for horizontal scaling.
 */

import fp from 'fastify-plugin';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config';

export default fp(async (app) => {
  // We need to ensure that the redis plugin is initialized first.
  // The global 'app.redis' is the publisher client.
  const pubClient = app.redis;
  const subClient = pubClient.duplicate();

  const io = new Server(app.server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
    // Attach the Redis adapter
    adapter: createAdapter(pubClient, subClient),
    transports: ['websocket', 'polling'], // Fallback gracefully if WS fails
  });

  // Middleware to authenticate socket connections via JWT
  io.use(async (socket, next) => {
    try {
      // Token can be passed in auth payload
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Unauthorized: No token provided'));
      }

      // Verify the JWT token
      const decoded = app.jwt.verify(token) as any;
      
      // Store user info in socket context
      socket.data.userId = decoded.sub;
      socket.data.role = decoded.role;
      socket.data.fullName = decoded.fullName;
      
      next();
    } catch (err) {
      next(new Error('Unauthorized: Invalid token'));
    }
  });

  // Handle connection events
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    
    // Automatically join a pre-determined personal room for this user
    // This allows us to push Notifications specifically to a single person.
    socket.join(`user:${userId}`);
    app.log.debug(`Socket connected: ${userId}`);

    // Client explicitly joins a hackathon workspace room
    socket.on('join:hackathon', (hackathonId: string) => {
      socket.join(`hackathon:${hackathonId}`);
      app.log.debug(`User ${userId} joined hackathon:${hackathonId}`);
    });

    // Client requests to leave a hackathon room
    socket.on('leave:hackathon', (hackathonId: string) => {
      socket.leave(`hackathon:${hackathonId}`);
      app.log.debug(`User ${userId} left hackathon:${hackathonId}`);
    });

    socket.on('disconnect', () => {
      app.log.debug(`Socket disconnected: ${userId}`);
    });
  });

  // Expose the io instance to fastify
  app.decorate('io', io);

  // Clean up
  app.addHook('onClose', async (instance) => {
    instance.io.close();
    await subClient.quit();
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}
