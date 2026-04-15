import { FastifyRequest, FastifyReply } from 'fastify';
import { ProjectService } from '../services/project.service';
import { successResponse } from '../utils/response';
import { CreateProjectPayload, UpdateProjectPayload, ChangeProjectStatusPayload } from '../schemas/project.schema';
import { RoleName } from '@prisma/client';

export async function createProjectHandler(req: FastifyRequest<{ Body: CreateProjectPayload }>, reply: FastifyReply) {
  const service = new ProjectService(req.server);
  const userId = (req.user as any)!.sub;
  const project = await service.createProject(userId, req.body);
  return reply.status(201).send(successResponse(project));
}

export async function updateProjectHandler(req: FastifyRequest<{ Params: { id: string }, Body: UpdateProjectPayload }>, reply: FastifyReply) {
  const service = new ProjectService(req.server);
  const userId = (req.user as any)!.sub;
  const project = await service.updateProject(req.params.id, userId, req.body);
  return reply.status(200).send(successResponse(project));
}

export async function changeProjectStatusHandler(req: FastifyRequest<{ Params: { id: string }, Body: ChangeProjectStatusPayload }>, reply: FastifyReply) {
  const service = new ProjectService(req.server);
  const userId = (req.user as any)!.sub;
  
  // Checking if the user has GLOBAL_ADMIN or ORGANIZER role
  const userRoles = await req.server.prisma.userRole.findMany({ where: { userId } });
  const hasAdminAccess = userRoles.some(r => r.roleName === RoleName.GLOBAL_ADMIN || r.roleName === RoleName.ORGANIZER);
  
  const project = await service.changeStatus(req.params.id, userId, req.body.status, hasAdminAccess);
  return reply.status(200).send(successResponse(project));
}

export async function getProjectHandler(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const service = new ProjectService(req.server);
  const project = await service.getProject(req.params.id);
  return reply.status(200).send(successResponse(project));
}

export async function listProjectsHandler(req: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) {
  const service = new ProjectService(req.server);
  const { page, limit, teamId, hackathonId, status } = req.query as any;
  const projects = await service.listProjects(page || 1, limit || 20, { teamId, hackathonId, status });
  return reply.status(200).send(successResponse(projects));
}
