import { FastifyRequest, FastifyReply } from 'fastify';
import { CriteriaService } from '../services/criteria.service';
import { successResponse } from '../utils/response';
import { CreateCriteriaPayload } from '../schemas/criteria.schema';
import { RoleName } from '@prisma/client';

export async function createCriteriaHandler(req: FastifyRequest<{ Params: { id: string }, Body: CreateCriteriaPayload }>, reply: FastifyReply) {
  const service = new CriteriaService(req.server);
  const userId = (req.user as any)!.sub;
  const hasGlobalAdmin = (req.user as any)!.role === RoleName.GLOBAL_ADMIN;
  
  const criteria = await service.createCriteria(req.params.id, userId, hasGlobalAdmin, req.body);
  return reply.status(201).send(successResponse(criteria));
}

export async function getCriteriaForHackathonHandler(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const service = new CriteriaService(req.server);
  const criteriaList = await service.getCriteriaForHackathon(req.params.id);
  return reply.status(200).send(successResponse(criteriaList));
}

export async function getProjectCriteriaHandler(req: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) {
  const service = new CriteriaService(req.server);
  const criteriaList = await service.getCriteriaForProject(req.params.projectId);
  return reply.status(200).send(successResponse(criteriaList));
}
