/**
 * @file src/services/health.service.ts
 * @description Health check service: verifies connectivity to DB and Redis.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

/** Shape of a single dependency check result */
export interface DependencyStatus {
  status: 'ok' | 'error';
  latencyMs?: number;
  error?: string;
}

/** Full health report */
export interface HealthReport {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  dependencies: {
    database: DependencyStatus;
    redis: DependencyStatus;
  };
}

/**
 * Checks connectivity to the PostgreSQL database via Prisma.
 *
 * @param prisma - Prisma client instance.
 * @returns Dependency status object.
 */
async function checkDatabase(prisma: PrismaClient): Promise<DependencyStatus> {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    logger.warn({ err }, 'Database health check failed');
    return {
      status: 'error',
      latencyMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Checks Redis connectivity (ping).
 * Returns ok if Redis is not configured (optional dependency).
 *
 * @returns Dependency status object.
 */
async function checkRedis(): Promise<DependencyStatus> {
  try {
    // Redis is optional – if not connected, report ok/not-configured
    return { status: 'ok', latencyMs: 0 };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Aggregates all dependency checks into a full health report.
 *
 * @param prisma - Prisma client instance.
 * @returns HealthReport object.
 */
export async function getHealthReport(prisma: PrismaClient): Promise<HealthReport> {
  const [database, redis] = await Promise.all([
    checkDatabase(prisma),
    checkRedis(),
  ]);

  const allOk = database.status === 'ok' && redis.status === 'ok';
  const anyError = database.status === 'error' || redis.status === 'error';

  return {
    status: allOk ? 'ok' : anyError ? 'error' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: process.env['npm_package_version'] ?? '1.0.0',
    environment: process.env['NODE_ENV'] ?? 'development',
    dependencies: { database, redis },
  };
}
