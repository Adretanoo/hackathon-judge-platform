/**
 * @file src/routes/team.routes.ts
 * @description Route definitions for Team Module.
 */

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { RoleName } from '@prisma/client';
import { TeamController } from '../controllers/team.controller';
import { hasRole } from '../middleware/auth';
import { 
  createTeamSchema, 
  updateTeamSchema, 
  generateInviteSchema, 
  hackathonParamsSchema,
  teamParamsSchema,
  listTeamsQuerySchema,
  freeAgentQuerySchema
} from '../schemas/team.schema';
import { z } from 'zod';

export async function teamRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const controller = new TeamController(fastify);

  // ─── Hackathon-Scoped Endpoints ─────────────────────────────────────────────

  /** Create a team */
  app.post(
    '/hackathons/:hackathonId/teams',
    {
      preHandler: [
        app.authenticate,
        hasRole([RoleName.PARTICIPANT], { context: 'hackathon', paramName: 'hackathonId' })
      ],
      schema: {
        tags: ['Teams'],
        summary: 'Create a new team',
        params: hackathonParamsSchema,
        body: createTeamSchema,
      },
    },
    controller.createTeam as any
  );

  /** List teams */
  app.get(
    '/hackathons/:hackathonId/teams',
    {
      schema: {
        tags: ['Teams'],
        summary: 'List teams in a hackathon',
        params: hackathonParamsSchema,
        querystring: listTeamsQuerySchema,
      },
    },
    controller.listTeams as any
  );

  /** List free agents */
  app.get(
    '/hackathons/:hackathonId/free-agents',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Teams'],
        summary: 'Find participants looking for a team',
        params: hackathonParamsSchema,
        querystring: freeAgentQuerySchema,
      },
    },
    controller.listFreeAgents as any
  );

  // ─── Team-Specific Endpoints ────────────────────────────────────────────────

  /** Get team details */
  app.get(
    '/teams/:teamId',
    {
      schema: {
        tags: ['Teams'],
        summary: 'Get team details and members',
        params: teamParamsSchema,
      },
    },
    controller.getTeam as any
  );

  /** Update team */
  app.patch(
    '/teams/:teamId',
    {
      preHandler: [app.authenticate], // Ownership check internal to controller/service
      schema: {
        tags: ['Teams'],
        summary: 'Update team details',
        params: teamParamsSchema,
        body: updateTeamSchema,
      },
    },
    controller.updateTeam as any
  );

  /** Generate invite */
  app.post(
    '/teams/:teamId/invite',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Teams'],
        summary: 'Generate an invitation link (token)',
        params: teamParamsSchema,
        body: generateInviteSchema,
      },
    },
    controller.invite as any
  );

  /** Join team */
  app.post(
    '/teams/join/:inviteToken',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Teams'],
        summary: 'Join a team using an invitation token',
        params: z.object({ inviteToken: z.string() }),
      },
    },
    controller.join as any
  );

  /** Remove member */
  app.delete(
    '/teams/:teamId/members/:userId',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Teams'],
        summary: 'Remove a member from the team',
        params: teamParamsSchema.extend({ userId: z.string().cuid() }),
      },
    },
    controller.removeMember as any
  );
}
