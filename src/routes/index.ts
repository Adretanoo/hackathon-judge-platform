/**
 * @file src/routes/index.ts
 * @description Aggregates and registers all application routes under the API prefix.
 */

import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { hackathonRoutes } from './hackathon.routes';
import { userRoutes } from './user.routes';
import { projectRoutes } from './project.routes';
import { teamRoutes } from './team.routes';
import { leaderboardRoutes } from './leaderboard.routes';
import { judgeConflictRoutes } from './judgeConflict.routes';
import { judgingRoutes } from './judging.routes';
import { exportRoutes } from './export.routes';
import { configRoutes } from './config.routes';
import { participantRoutes } from './participant.routes';
import { env } from '../config';

/**
 * Registers every route group on the Fastify instance.
 *
 * @param app - Fastify application instance.
 */
export async function registerRoutes(app: any): Promise<void> {
  // ── Health
  await app.register(healthRoutes);

  // ── Versioned API
  await app.register(
    async (api: any) => {
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(hackathonRoutes, { prefix: '/hackathons' });
      await api.register(projectRoutes,   { prefix: '/projects' });
      await api.register(teamRoutes,      { prefix: '/' });
      await api.register(leaderboardRoutes, { prefix: '/hackathons' });
      await api.register(judgeConflictRoutes, { prefix: '/hackathons' });
      await api.register(judgingRoutes,       { prefix: '/judging' });
      await api.register(exportRoutes,        { prefix: '/hackathons' });
      await api.register(userRoutes,      { prefix: '/users' });
      await api.register(configRoutes,    { prefix: '/config' });
      await api.register(participantRoutes, { prefix: '/participant' });
    },
    { prefix: env.API_PREFIX },
  );
}
