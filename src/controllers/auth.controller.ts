/**
 * @file src/controllers/auth.controller.ts
 * @description Request handlers for authentication endpoints.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from '../services/auth.service';
import type { RegisterBody, LoginBody, RefreshTokenBody } from '../schemas/auth.schema';
import { successResponse } from '../utils/response';

/**
 * POST /api/v1/auth/register
 * Creates a new user account and returns tokens.
 */
export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const service = new AuthService(request.server.prisma, request.server);
  const result = await service.register(request.body);
  return reply.status(201).send(successResponse(result));
}

/**
 * POST /api/v1/auth/login
 * Authenticates user credentials and returns tokens.
 */
export async function loginHandler(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const service = new AuthService(request.server.prisma, request.server);
  const result = await service.login(request.body);
  return reply.status(200).send(successResponse(result));
}

/**
 * POST /api/v1/auth/refresh
 * Exchanges a refresh token for a new access token pair.
 */
export async function refreshHandler(
  request: FastifyRequest<{ Body: RefreshTokenBody }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const service = new AuthService(request.server.prisma, request.server);
  const tokens = await service.refresh(request.body.refreshToken);
  return reply.status(200).send(successResponse(tokens));
}

/**
 * GET /api/v1/auth/me
 * Returns the profile of the currently authenticated user.
 */
export async function meHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  return reply.status(200).send(successResponse(request.user));
}
