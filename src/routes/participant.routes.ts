/**
 * @file src/routes/participant.routes.ts
 * @description Routes for hackathon participants (my hackathons, status, team lookup).
 */
import type { FastifyInstance } from 'fastify';
import { RoleName } from '@prisma/client';
import { z } from 'zod';
import { cuidSchema } from '../schemas/common';
import { successResponse } from '../utils/response';

export async function participantRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /participant/hackathons
   * List hackathons where the current user is registered as PARTICIPANT.
   */
  app.get(
    '/hackathons',
    {
      schema: {
        tags: ['Participant'],
        summary: 'List hackathons where current user is a participant',
        security: [{ BearerAuth: [] }],
      },
      preHandler: [app.authenticate],
    },
    async (req, reply) => {
      const userId = (req.user as any)!.sub;

      const roles = await app.prisma.userRole.findMany({
        where: { userId, roleName: RoleName.PARTICIPANT, hackathonId: { not: null } },
        include: {
          hackathon: {
            select: {
              id: true,
              title: true,
              status: true,
              startDate: true,
              endDate: true,
              description: true,
              isOnline: true,
              maxTeamSize: true,
              _count: { select: { userRoles: true } },
            },
          },
        },
      }) as any[];

      const hackathons = roles
        .filter(r => r.hackathon)
        .map(r => r.hackathon);

      return reply.status(200).send(successResponse(hackathons));
    }
  );

  /**
   * GET /participant/teams
   * List all teams where the current user is a member.
   */
  app.get(
    '/teams',
    {
      schema: {
        tags: ['Participant'],
        summary: 'List teams where current user is a member',
        security: [{ BearerAuth: [] }],
      },
      preHandler: [app.authenticate],
    },
    async (req, reply) => {
      const userId = (req.user as any)!.sub;

      const memberships = await app.prisma.teamMember.findMany({
        where: { userId },
        include: {
          team: {
            include: {
              hackathon: { select: { title: true, id: true } }
            }
          }
        }
      });

      const teams = memberships.map(m => m.team);
      return reply.status(200).send(successResponse(teams));
    }
  );

  /**
   * GET /participant/hackathons/:hackathonId/status
   * Returns the full participation context: team, project, registration info.
   */
  app.get(
    '/hackathons/:hackathonId/status',
    {
      schema: {
        tags: ['Participant'],
        summary: 'Get participation status for a specific hackathon',
        security: [{ BearerAuth: [] }],
        params: z.object({ hackathonId: cuidSchema }),
      },
      preHandler: [app.authenticate],
    },
    async (req: any, reply) => {
      const userId = (req.user as any)!.sub;
      const { hackathonId } = req.params;

      // Check registration
      const registration = await app.prisma.userRole.findFirst({
        where: { userId, hackathonId, roleName: RoleName.PARTICIPANT },
      });

      if (!registration) {
        return reply.status(200).send(successResponse({ registered: false, team: null, project: null }));
      }

      const membership = await app.prisma.teamMember.findFirst({
        where: {
          userId,
          team: { hackathonId },
        },
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: { select: { id: true, fullName: true, username: true, avatarUrl: true } },
                },
              },
              projects: true,
            },
          },
        },
      });

      console.log(`[STATUS ENDPOINT] userId=${userId}, hackathonId=${hackathonId}`);
      console.log(`[STATUS ENDPOINT] Membership found:`, membership ? `YES (teamId: ${membership.teamId})` : `NO`);

      const respPayload = {
        registered: true,
        role: membership?.role ?? null,
        team: membership?.team ?? null,
        project: membership?.team?.projects?.[0] ?? null,
      };

      console.log(`[STATUS ENDPOINT] Returning:`, { registered: true, hasTeam: !!respPayload.team });

      return reply.status(200).send(successResponse(respPayload));
    }
  );

  /**
   * POST /participant/hackathons/:hackathonId/leave
   * Leave the hackathon. Will also remove the user from any team they are in.
   */
  app.post(
    '/hackathons/:hackathonId/leave',
    {
      schema: {
        tags: ['Participant'],
        summary: 'Leave the hackathon platform entirely',
        security: [{ BearerAuth: [] }],
        params: z.object({ hackathonId: cuidSchema }),
      },
      preHandler: [app.authenticate],
    },
    async (req: any, reply) => {
      const { hackathonId } = req.params;
      const userId = (req.user as any)!.sub;
      
      // Need to use hackathonService and teamService
      // These are normally accessible if injected, or we can instantiate or use app.diContainer if we have one.
      // Wait, how are services accessed in these routes?
      // Ah! Fastify routes here usually don't have direct access unless passed in.
      // Let's resolve the services directly.
      const hackathonService = new (await import('../services/hackathon.service')).HackathonService(app.prisma);
      const teamService = new (await import('../services/team.service')).TeamService(app);
      
      const result = await hackathonService.leavePlatform(hackathonId, userId, teamService);
      return reply.status(200).send(successResponse(result));
    }
  );
}
