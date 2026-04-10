/**
 * @file src/controllers/auth.controller.ts
 * @description Request handlers for authentication endpoints.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CookieSerializeOptions } from '@fastify/cookie';
import ms from 'ms';
import { AuthService } from '../services/auth.service';
import type { RegisterBody, LoginBody } from '../schemas/auth.schema';
import { successResponse } from '../utils/response';
import { env } from '../config';
import { UnauthorizedError } from '../utils/errors';

/** Cookie options for the refresh token */
function getCookieOptions(): CookieSerializeOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth', // Path restricted
    maxAge: ms(env.JWT_REFRESH_EXPIRES_IN as string) / 1000, // seconds
  };
}

export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const service = new AuthService(request.server.prisma, request.server);
  const ip = request.ip;
  const ua = request.headers['user-agent'];

  const { refreshToken, accessToken, user } = await service.register(request.body, ip, ua);
  
  reply.setCookie('refreshToken', refreshToken, getCookieOptions());
  
  return reply.status(201).send(successResponse({ accessToken, user }));
}

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const service = new AuthService(request.server.prisma, request.server);
  const ip = request.ip;
  const ua = request.headers['user-agent'];

  const { refreshToken, accessToken, user } = await service.login(request.body, ip, ua);
  
  reply.setCookie('refreshToken', refreshToken, getCookieOptions());

  return reply.status(200).send(successResponse({ accessToken, user }));
}

export async function refreshHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const refreshToken = request.cookies.refreshToken;
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token missing in cookies');
  }

  const service = new AuthService(request.server.prisma, request.server);
  const ip = request.ip;
  const ua = request.headers['user-agent'];

  const tokens = await service.refresh(refreshToken, ip, ua);
  
  reply.setCookie('refreshToken', tokens.refreshToken, getCookieOptions());

  return reply.status(200).send(successResponse({ accessToken: tokens.accessToken }));
}

export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const refreshToken = request.cookies.refreshToken;
  if (refreshToken) {
    const service = new AuthService(request.server.prisma, request.server);
    await service.logout(refreshToken);
  }

  reply.clearCookie('refreshToken', { path: '/api/v1/auth' });
  return reply.status(200).send(successResponse({ message: 'Logged out successfully' }));
}

export async function meHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  // We can fetch full profile from DB if we want, or rely on jwt content
  return reply.status(200).send(successResponse(request.user));
}
