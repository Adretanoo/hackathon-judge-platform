/**
 * @file src/routes/export.routes.ts
 * @description Export routes for CSV and PDF hackathon reports.
 *              Mounted under /api/v1/hackathons (prefix handled by index.ts).
 *
 * Endpoints:
 *   GET /:hackathonId/export/csv  — Full leaderboard report as .csv
 *   GET /:hackathonId/export/pdf  — Top-3 certificates + participant list as .pdf
 *
 * Access: ORGANIZER of the specific hackathon only.
 */

import type { FastifyInstance } from 'fastify';
import { RoleName } from '@prisma/client';
import { hasRole } from '../middleware/auth';
import { exportCsvHandler, exportPdfHandler } from '../controllers/export.controller';

export async function exportRoutes(app: FastifyInstance): Promise<void> {
  const preHandler = [
    app.authenticate,
    hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], {
      context: 'hackathon',
      paramName: 'hackathonId',
    }),
  ];

  // ── GET /:hackathonId/export/csv ───────────────────────────────────────────
  app.get(
    '/:hackathonId/export/csv',
    {
      schema: {
        tags: ['Hackathons', 'Export'],
        summary: 'Export hackathon results as CSV',
        description:
          'Returns a UTF-8 CSV file containing all submitted projects ranked by ' +
          'normalized (Z-score) leaderboard score. Includes raw scores, judge count, ' +
          'team members, and track info. Accessible only to hackathon ORGANIZER.',
        security: [{ BearerAuth: [] }],
        params: {
          type: 'object',
          properties: { hackathonId: { type: 'string' } },
          required: ['hackathonId'],
        },
        response: {
          200: { type: 'string', description: 'CSV file content' },
        },
      },
      preHandler,
    },
    exportCsvHandler as any,
  );

  // ── GET /:hackathonId/export/pdf ───────────────────────────────────────────
  app.get(
    '/:hackathonId/export/pdf',
    {
      schema: {
        tags: ['Hackathons', 'Export'],
        summary: 'Export hackathon certificates as PDF',
        description:
          'Generates a multi-page PDF document containing: ' +
          'page 1 — full leaderboard summary table; ' +
          'pages 2-4 — individual achievement certificates for top-3 teams. ' +
          'Accessible only to hackathon ORGANIZER.',
        security: [{ BearerAuth: [] }],
        params: {
          type: 'object',
          properties: { hackathonId: { type: 'string' } },
          required: ['hackathonId'],
        },
        response: {
          200: { type: 'string', format: 'binary', description: 'PDF file content' },
        },
      },
      preHandler,
    },
    exportPdfHandler as any,
  );
}
