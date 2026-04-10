/**
 * @file src/plugins/websocket.ts
 * @description Registers @fastify/websocket to enable real-time communication.
 */

import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';

export default fp(async (app) => {
  await app.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
    },
  });

  app.log.info('✅  Websocket plugin registered');
});
