/**
 * @file src/controllers/hackathon.controller.ts
 * @description Controllers for hackathon CRUD and sub-entities.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { HackathonService } from '../services/hackathon.service';
import { JudgeService } from '../services/judge.service';
import { successResponse } from '../utils/response';
import type { 
  CreateHackathonBody, UpdateHackathonBody, ChangeHackathonStatusBody,
  CreateStageBody, UpdateStageBody, CreateTrackBody, UpdateTrackBody,
  CreateAwardBody, UpdateAwardBody, AssignJudgeBody
} from '../schemas/hackathon.schema';
import type { JwtPayload } from '../types';

export async function createHackathonHandler(
  request: FastifyRequest<{ Body: CreateHackathonBody }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const user = request.user as JwtPayload;
  const result = await service.createHackathon(user.sub, request.body);
  return reply.status(201).send(successResponse(result));
}

export async function getHackathonsHandler(
  request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const { page, limit } = request.query;
  const result = await service.listHackathons(Number(page) || 1, Number(limit) || 20);
  return reply.status(200).send(successResponse(result));
}

export async function getHackathonByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.getHackathonById(request.params.id);
  return reply.status(200).send(successResponse(result));
}

export async function updateHackathonHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateHackathonBody }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.updateHackathon(request.params.id, request.body);
  return reply.status(200).send(successResponse(result));
}

export async function changeHackathonStatusHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: ChangeHackathonStatusBody }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.changeStatus(request.params.id, request.body);
  return reply.status(200).send(successResponse(result));
}

// ─── Stages ──────────────────────────────────────────────────────────────────

export async function createStageHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: CreateStageBody }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.createStage(request.params.id, request.body);
  return reply.status(201).send(successResponse(result));
}

export async function updateStageHandler(
  request: FastifyRequest<{ Params: { id: string; stageId: string }; Body: UpdateStageBody }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.updateStage(request.params.id, request.params.stageId, request.body);
  return reply.status(200).send(successResponse(result));
}

export async function deleteStageHandler(
  request: FastifyRequest<{ Params: { id: string; stageId: string } }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.deleteStage(request.params.id, request.params.stageId);
  return reply.status(200).send(successResponse(result));
}

// ─── Tracks ──────────────────────────────────────────────────────────────────

export async function createTrackHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: CreateTrackBody }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.createTrack(request.params.id, request.body);
  return reply.status(201).send(successResponse(result));
}

export async function updateTrackHandler(
  request: FastifyRequest<{ Params: { id: string; trackId: string }; Body: UpdateTrackBody }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.updateTrack(request.params.id, request.params.trackId, request.body);
  return reply.status(200).send(successResponse(result));
}

export async function deleteTrackHandler(
  request: FastifyRequest<{ Params: { id: string; trackId: string } }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.deleteTrack(request.params.id, request.params.trackId);
  return reply.status(200).send(successResponse(result));
}

// ─── Awards ──────────────────────────────────────────────────────────────────

export async function createAwardHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: CreateAwardBody }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.createAward(request.params.id, request.body);
  return reply.status(201).send(successResponse(result));
}

export async function updateAwardHandler(
  request: FastifyRequest<{ Params: { id: string; awardId: string }; Body: UpdateAwardBody }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.updateAward(request.params.id, request.params.awardId, request.body);
  return reply.status(200).send(successResponse(result));
}

export async function deleteAwardHandler(
  request: FastifyRequest<{ Params: { id: string; awardId: string } }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.deleteAward(request.params.id, request.params.awardId);
  return reply.status(200).send(successResponse(result));
}

// ─── Participants & Judges ───────────────────────────────────────────────

export async function registerParticipantHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const user = request.user as JwtPayload;
  const result = await service.registerParticipant(request.params.id, user.sub);
  return reply.status(200).send(successResponse(result));
}

export async function listParticipantsHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const service = new HackathonService(request.server.prisma);
  const result = await service.listParticipants(request.params.id);
  return reply.status(200).send(successResponse(result));
}

export async function assignJudgeHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: AssignJudgeBody }>,
  reply: FastifyReply,
) {
  const service = new JudgeService(request.server.prisma);
  const result = await service.assignJudge({
    hackathonId: request.params.id,
    userId: request.body.userId,
    trackId: request.body.trackId,
    allowConflictOverride: request.body.allowConflictOverride,
  });

  const statusCode = result.status === 'warning' ? 201 : 201;
  return reply.status(statusCode).send(result);
}

export async function removeJudgeHandler(
  request: FastifyRequest<{ Params: { id: string; userId: string } }>,
  reply: FastifyReply,
) {
  const service = new JudgeService(request.server.prisma);
  const result = await service.removeJudge(request.params.id, request.params.userId);
  return reply.status(200).send(successResponse(result));
}

export async function listJudgesHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const service = new JudgeService(request.server.prisma);
  const result = await service.listJudges(request.params.id);
  return reply.status(200).send(successResponse(result));
}
