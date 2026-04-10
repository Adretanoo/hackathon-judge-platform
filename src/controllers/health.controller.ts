/**
 * @file src/controllers/health.controller.ts
 * @description Health-check route handlers.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getHealthReport } from '../services/health.service';
import { successResponse } from '../utils/response';

const prisma = new PrismaClient();

/**
 * GET /health
 * Returns a lightweight liveness check (no dependency probing).
 */
export async function livenessHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  return reply.status(200).send(
    successResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  );
}

/**
 * GET /health/ready
 * Full readiness check including database and Redis connectivity.
 */
export async function readinessHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const report = await getHealthReport(prisma);
  const statusCode = report.status === 'ok' ? 200 : 503;
  return reply.status(statusCode).send(successResponse(report));
}
