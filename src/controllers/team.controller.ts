/**
 * @file src/controllers/team.controller.ts
 * @description Controller for Team Module endpoints.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { TeamService } from '../services/team.service';
import { successResponse } from '../utils/response';
import { 
  CreateTeamBody, 
  UpdateTeamBody, 
  GenerateInviteBody, 
  ListTeamsQuery,
  FreeAgentQuery
} from '../schemas/team.schema';

export class TeamController {
  private teamService: TeamService;

  constructor(app: any) {
    this.teamService = new TeamService(app);
  }

  createTeam = async (
    req: FastifyRequest<{ Params: { hackathonId: string }; Body: CreateTeamBody }>,
    reply: FastifyReply
  ) => {
    const { hackathonId } = req.params;
    const userId = (req.user as any).sub;
    const team = await this.teamService.createTeam(hackathonId, userId, req.body);
    return reply.status(201).send(successResponse(team));
  };

  listTeams = async (
    req: FastifyRequest<{ Params: { hackathonId: string }; Querystring: ListTeamsQuery }>,
    reply: FastifyReply
  ) => {
    const { hackathonId } = req.params;
    const { items, meta } = await this.teamService.listTeams(hackathonId, req.query);
    return reply.send(successResponse(items, meta));
  };

  getTeam = async (
    req: FastifyRequest<{ Params: { teamId: string } }>,
    reply: FastifyReply
  ) => {
    const { teamId } = req.params;
    const team = await this.teamService.getTeamById(teamId);
    return reply.send(successResponse(team));
  };

  updateTeam = async (
    req: FastifyRequest<{ Params: { teamId: string }; Body: UpdateTeamBody }>,
    reply: FastifyReply
  ) => {
    const { teamId } = req.params;
    const userId = (req.user as any).sub;
    const team = await this.teamService.updateTeam(teamId, userId, req.body);
    return reply.send(successResponse(team));
  };

  invite = async (
    req: FastifyRequest<{ Params: { teamId: string }; Body: GenerateInviteBody }>,
    reply: FastifyReply
  ) => {
    const { teamId } = req.params;
    const userId = (req.user as any).sub;
    const invite = await this.teamService.generateInvite(teamId, userId, req.body);
    return reply.status(201).send(successResponse(invite));
  };

  join = async (
    req: FastifyRequest<{ Params: { inviteToken: string } }>,
    reply: FastifyReply
  ) => {
    const { inviteToken } = req.params;
    const userId = (req.user as any).sub;
    const result = await this.teamService.joinByToken(inviteToken, userId);
    return reply.send(successResponse(result));
  };

  removeMember = async (
    req: FastifyRequest<{ Params: { teamId: string; userId: string } }>,
    reply: FastifyReply
  ) => {
    const { teamId, userId: targetUserId } = req.params;
    const callerId = (req.user as any).sub;
    await this.teamService.removeMember(teamId, targetUserId, callerId);
    return reply.send(successResponse({ message: 'Member removed successfully' }));
  };

  listFreeAgents = async (
    req: FastifyRequest<{ Params: { hackathonId: string }; Querystring: FreeAgentQuery }>,
    reply: FastifyReply
  ) => {
    const { hackathonId } = req.params;
    const { items, meta } = await this.teamService.getFreeAgents(hackathonId, req.query);
    return reply.send(successResponse(items, meta));
  };
}
