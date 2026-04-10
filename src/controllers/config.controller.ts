/**
 * @file src/controllers/config.controller.ts
 * @description Business logic for viewing and updating system configurations.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UpdateConfigBody } from '../schemas/config.schema';

/**
 * GET /config
 * Returns all system configuration entries.
 */
export async function listConfigsHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const configs = await req.server.prisma.systemConfig.findMany();
    
    // Convert array to a key-value Record for easier frontend parsing
    const configMap = configs.reduce((acc: Record<string, any>, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, any>);

    return reply.send({
      success: true,
      data: configMap,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve config' },
    });
  }
}

/**
 * PATCH /config
 * Upserts a batch of system configurations.
 */
export async function updateConfigsHandler(
  req: FastifyRequest<{ Body: UpdateConfigBody }>,
  reply: FastifyReply
) {
  try {
    const { configs } = req.body;

    // Run all upserts in a transaction
    const results = await req.server.prisma.$transaction(
      configs.map((c) =>
        req.server.prisma.systemConfig.upsert({
          where: { key: c.key },
          update: { value: c.value !== undefined ? c.value : null },
          create: { key: c.key, value: c.value !== undefined ? c.value : null },
        })
      )
    );

    return reply.send({
      success: true,
      data: {
        message: 'Configurations updated successfully',
        updatedCount: results.length,
      },
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update config' },
    });
  }
}
