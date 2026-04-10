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

  const redis = new Redis(redisConfig as any);

  redis.on('connect', () => {
    app.log.info('✅  Redis connected');
  });

  redis.on('error', (err) => {
    app.log.error({ err }, '🚨  Redis connection error');
  });

  app.decorate('redis', redis);

  app.addHook('onClose', async (instance) => {
    await instance.redis.quit();
  });
});

// TypeScript decoration
declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}
