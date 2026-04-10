/**
 * @file src/controllers/judgeConflict.controller.ts
 * @description Controllers for listing and overriding Judge Conflicts.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { JudgeConflictService } from '../services/judgeConflict.service';
import { successResponse } from '../utils/response';
import type { OverrideConflictBody } from '../schemas/judgeConflict.schema';
import type { JwtPayload } from '../types';

export async function listConflictsHandler(
  request: FastifyRequest<{ Params: { hackathonId: string } }>,
  reply: FastifyReply,
) {
  const service = new JudgeConflictService(request.server.prisma);
  const result = await service.listConflicts(request.params.hackathonId);
  return reply.status(200).send(successResponse(result));
}

export async function overrideConflictHandler(
  request: FastifyRequest<{ Params: { hackathonId: string; conflictId: string }; Body: OverrideConflictBody }>,
  reply: FastifyReply,
) {
  const service = new JudgeConflictService(request.server.prisma);
  const user = request.user as JwtPayload;
  const result = await service.overrideConflict(request.params.conflictId, user.sub, request.body.overrideReason);
  return reply.status(200).send(successResponse(result));
}
