/**
 * @file src/controllers/export.controller.ts
 * @description HTTP handlers for CSV and PDF export endpoints.
 *              Both set appropriate Content-Disposition headers so browsers
 *              trigger a file download rather than displaying inline.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { ExportService } from '../services/export.service';

export async function exportCsvHandler(
  request: FastifyRequest<{ Params: { hackathonId: string } }>,
  reply: FastifyReply,
) {
  const service = new ExportService(request.server);
  const csv = await service.exportCsv(request.params.hackathonId);

  const filename = `hackathon-${request.params.hackathonId}-results.csv`;
  return reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .header('Cache-Control', 'no-store')
    .send(csv);
}

export async function exportPdfHandler(
  request: FastifyRequest<{ Params: { hackathonId: string } }>,
  reply: FastifyReply,
) {
  const service = new ExportService(request.server);
  const pdf = await service.exportPdf(request.params.hackathonId);

  const filename = `hackathon-${request.params.hackathonId}-certificates.pdf`;
  return reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .header('Cache-Control', 'no-store')
    .send(pdf);
}
