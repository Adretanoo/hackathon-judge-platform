/**
 * @file src/plugins/redis.ts
 * @description Registers ioredis and decorates Fastify instance with a 'redis' property.
 */

import fp from 'fastify-plugin';
import Redis from 'ioredis';
import { env } from '../config';

export default fp(async (app) => {
  const redisConfig = env.REDIS_URL || {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  };

  const options: any = {
    maxRetriesPerRequest: null,
    retryStrategy: () => null,           // disable reconnect loop
    enableOfflineQueue: false,           // don't queue commands when offline
    lazyConnect: true,                   // don't connect immediately
  };

  const redis = typeof redisConfig === 'string'
    ? new Redis(redisConfig, options)
    : new Redis({ ...redisConfig, ...options });

  // MUST attach error handler BEFORE connect to suppress "missing handler" crash
  redis.on('error', (err: Error) => {
    app.log.warn({ err: err.message }, '⚠️  Redis unavailable — caching disabled');
  });

  redis.on('connect', () => {
    app.log.info('✅  Redis connected');
  });

  // Attempt connection (non-fatal: server starts even if Redis is down)
  try {
    await redis.connect();
  } catch {
    app.log.warn('⚠️  Redis connection failed — leaderboard caching disabled, all else works');
  }

  app.decorate('redis', redis);

  app.addHook('onClose', async (instance) => {
    try { await instance.redis.quit(); } catch { /* ignore */ }
  });
});

// TypeScript decoration
declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}
