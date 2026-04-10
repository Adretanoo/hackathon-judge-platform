/**
 * @file src/routes/index.ts
 * @description Aggregates and registers all application routes under the API prefix.
 */

import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { env } from '../config';

/**
 * Registers every route group on the Fastify instance.
 * Health routes are mounted at the root level; all others under API_PREFIX.
 *
 * @param app - Fastify application instance.
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // ── Health (no prefix — accessible by k8s probes directly) ──────────────
  await app.register(healthRoutes);

  // ── Versioned API ────────────────────────────────────────────────────────
  await app.register(
    async (api) => {
      await api.register(authRoutes, { prefix: '/auth' });

      // Phase 2 – uncomment as you implement each module:
      // await api.register(hackathonRoutes, { prefix: '/hackathons' });
      // await api.register(projectRoutes,   { prefix: '/projects' });
      // await api.register(criteriaRoutes,  { prefix: '/criteria' });
      // await api.register(scoreRoutes,     { prefix: '/scores' });
      // await api.register(leaderboardRoutes, { prefix: '/leaderboard' });
      // await api.register(userRoutes,      { prefix: '/users' });
    },
    { prefix: env.API_PREFIX },
  );
}
