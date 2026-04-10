/**
 * @file src/controllers/user.controller.ts
 * @description Handlers for User Management endpoints.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/user.service';
import { successResponse } from '../utils/response';
import type { ListUsersQuery, UpdateUserAdminBody, AssignRoleBody } from '../schemas/user.schema';

export async function getUsersHandler(
  request: FastifyRequest<{ Querystring: ListUsersQuery }>,
  reply: FastifyReply,
) {
  const service = new UserService(request.server.prisma);
  const result = await service.listUsers(request.query);
  return reply.send(successResponse(result));
}

export async function getUserByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const service = new UserService(request.server.prisma);
  const result = await service.getUserById(request.params.id);
  return reply.send(successResponse(result));
}

export async function updateUserHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserAdminBody }>,
  reply: FastifyReply,
) {
  const service = new UserService(request.server.prisma);
  const result = await service.updateUser(request.params.id, request.body);
  return reply.send(successResponse(result));
}

export async function deleteUserHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const service = new UserService(request.server.prisma);
  const result = await service.deleteUser(request.params.id);
  return reply.send(successResponse(result));
}

export async function assignRoleHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: AssignRoleBody }>,
  reply: FastifyReply,
) {
  const service = new UserService(request.server.prisma);
  const result = await service.assignRole(request.params.id, request.body);
  return reply.send(successResponse(result));
}
