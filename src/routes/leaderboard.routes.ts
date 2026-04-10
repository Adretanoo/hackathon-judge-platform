/**
 * @file src/routes/leaderboard.routes.ts
 * @description Routes for the hackathon leaderboard.
 */

import type { FastifyInstance } from 'fastify';
import { getLeaderboardHandler, leaderboardWebSocketHandler } from '../controllers/leaderboard.controller';

export async function leaderboardRoutes(app: FastifyInstance): Promise<void> {
  // HTTP: GET /api/v1/hackathons/:id/leaderboard
  app.get(
    '/:id/leaderboard',
    {
      schema: {
        tags: ['Leaderboard'],
        summary: 'Get leaderboard for a specific hackathon',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            trackId: { type: 'string' },
          },
        },
      },
    },
    getLeaderboardHandler as any
  );

  // WebSocket: /api/v1/hackathons/:id/leaderboard/ws
  app.get(
    '/:id/leaderboard/ws',
    { 
      websocket: true,
      schema: {
        hide: true, // Hide from Swagger as it's WS
      }
    },
    leaderboardWebSocketHandler
  );
}
