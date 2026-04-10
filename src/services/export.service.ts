/**
 * @file src/services/export.service.ts
 * @description CSV and PDF export service for hackathon results.
 *
 * CSV  → @json2csv/plainjs  (zero-dep, no streams required)
 * PDF  → pdf-lib            (pure-JS, TypeScript-first, no native bindings)
 */

import { FastifyInstance } from 'fastify';
import { Parser as CsvParser } from '@json2csv/plainjs';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import { NotFoundError } from '../utils/errors';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportRow {
  rank: number;
  projectTitle: string;
  teamName: string;
  track: string;
  totalRawScore: number;
  averageRawScore: number;
  normalizedScore: number;
  judgeCount: number;
  participants: string; // semicolon-joined usernames
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ExportService {
  constructor(private readonly app: FastifyInstance) {}

  // ---------------------------------------------------------------------------
  // Shared data builder — used by both CSV and PDF
  // ---------------------------------------------------------------------------

  private async buildLeaderboardData(hackathonId: string): Promise<{
    hackathon: { title: string; startDate: Date; endDate: Date };
    rows: ExportRow[];
  }> {
    const hackathon = await this.app.prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { title: true, startDate: true, endDate: true },
    });

    if (!hackathon) throw new NotFoundError('Hackathon not found');

    // Fetch submitted/judged projects with all relations
    const projects = await this.app.prisma.project.findMany({
      where: {
        team: { hackathonId },
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED'] },
      },
      include: {
        team: {
          include: {
            track: true,
            members: { include: { user: { select: { username: true } } } },
          },
        },
        scores: { include: { criteria: true } },
      },
    });

    // Build per-judge stats for Z-score normalization
    const allScores = await this.app.prisma.score.findMany({
      where: { project: { team: { hackathonId } } },
    });

    const judgeValuesMap = new Map<string, number[]>();
    for (const s of allScores) {
      if (!judgeValuesMap.has(s.judgeId)) judgeValuesMap.set(s.judgeId, []);
      judgeValuesMap.get(s.judgeId)!.push(Number(s.scoreValue));
    }

    const judgeStats = new Map<string, { mean: number; stdDev: number }>();
    for (const [jId, vals] of judgeValuesMap) {
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance =
        vals.length > 1
          ? vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length - 1)
          : 0;
      judgeStats.set(jId, { mean, stdDev: Math.sqrt(variance) || 1 });
    }

    // Compute normalized score for each project
    const rows: (ExportRow & { _normalized: number })[] = projects.map((proj) => {
      let normalizedTotal = 0;
      const judgeIds = new Set<string>();

      for (const s of proj.scores) {
        const stats = judgeStats.get(s.judgeId) ?? { mean: 0, stdDev: 1 };
        const z = (Number(s.scoreValue) - stats.mean) / stats.stdDev;
        normalizedTotal += z * Number(s.criteria.weight);
        judgeIds.add(s.judgeId);
      }

      return {
        rank: 0,
        projectTitle: proj.title,
        teamName: proj.team.name,
        track: proj.team.track?.name ?? 'N/A',
        totalRawScore: Number(proj.totalScore ?? 0),
        averageRawScore: Number(proj.averageScore ?? 0),
        normalizedScore: Math.round(normalizedTotal * 100) / 100,
        judgeCount: judgeIds.size,
        participants: proj.team.members.map((m) => m.user.username).join('; '),
        _normalized: normalizedTotal,
      };
    });

    // Sort and assign rank
    rows.sort((a, b) => b._normalized - a._normalized);
    rows.forEach((r, i) => {
      r.rank = i + 1;
    });

    return {
      hackathon,
      rows: rows.map(({ _normalized: _n, ...rest }) => rest),
    };
  }

  // ---------------------------------------------------------------------------
  // CSV export
  // ---------------------------------------------------------------------------

  async exportCsv(hackathonId: string): Promise<Buffer> {
    const { hackathon, rows } = await this.buildLeaderboardData(hackathonId);

    const fields = [
      { label: 'Rank', value: 'rank' },
      { label: 'Project', value: 'projectTitle' },
      { label: 'Team', value: 'teamName' },
      { label: 'Track', value: 'track' },
      { label: 'Raw Score (total)', value: 'totalRawScore' },
      { label: 'Raw Score (avg)', value: 'averageRawScore' },
      { label: 'Normalized Score', value: 'normalizedScore' },
      { label: 'Judges', value: 'judgeCount' },
      { label: 'Participants', value: 'participants' },
    ];

    const parser = new CsvParser({ fields });
    const csv = parser.parse(rows);

    // Prepend metadata header
    const header =
      `# Hackathon: ${hackathon.title}\n` +
      `# Period: ${hackathon.startDate.toISOString().slice(0, 10)} — ${hackathon.endDate.toISOString().slice(0, 10)}\n` +
      `# Exported: ${new Date().toISOString()}\n\n`;

    return Buffer.from(header + csv, 'utf-8');
  }

  // ---------------------------------------------------------------------------
  // PDF export — certificates for top-3 + participant list
  // ---------------------------------------------------------------------------

  async exportPdf(hackathonId: string): Promise<Buffer> {
    const { hackathon, rows } = await this.buildLeaderboardData(hackathonId);

    const pdfDoc = await PDFDocument.create();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const GOLD = rgb(0.83, 0.68, 0.21);
    const SILVER = rgb(0.55, 0.55, 0.55);
    const BRONZE = rgb(0.72, 0.45, 0.2);
    const DARK = rgb(0.1, 0.1, 0.1);
    const ACCENT = rgb(0.25, 0.35, 0.8);
    const LIGHT_BG = rgb(0.97, 0.97, 1.0);

    const medalColors = [GOLD, SILVER, BRONZE];
    const medalLabels = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];

    // ── Page 1: Leaderboard summary ──────────────────────────────────────────
    const summaryPage = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = summaryPage.getSize();

    // Background accent bar
    summaryPage.drawRectangle({
      x: 0,
      y: height - 80,
      width,
      height: 80,
      color: ACCENT,
    });

    summaryPage.drawText('Hackathon Results', {
      x: 40,
      y: height - 52,
      size: 28,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    summaryPage.drawText(hackathon.title, {
      x: 40,
      y: height - 72,
      size: 12,
      font: regularFont,
      color: rgb(0.85, 0.85, 1),
    });

    summaryPage.drawText(
      `${hackathon.startDate.toDateString()} — ${hackathon.endDate.toDateString()}`,
      {
        x: width - 280,
        y: height - 60,
        size: 10,
        font: regularFont,
        color: rgb(0.85, 0.85, 1),
      },
    );

    // Column headers
    let y = height - 110;
    const cols = { rank: 40, project: 75, team: 210, track: 320, score: 420, judges: 490 };

    summaryPage.drawRectangle({ x: 30, y: y - 4, width: width - 60, height: 20, color: ACCENT });
    for (const [label, x] of Object.entries({
      '#': cols.rank,
      Project: cols.project,
      Team: cols.team,
      Track: cols.track,
      'Norm.Score': cols.score,
      Judges: cols.judges,
    })) {
      summaryPage.drawText(label, { x, y, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    }

    y -= 24;

    for (const row of rows) {
      if (y < 60) break; // Don't overflow the page

      if (row.rank % 2 === 0) {
        summaryPage.drawRectangle({ x: 30, y: y - 4, width: width - 60, height: 16, color: LIGHT_BG });
      }

      const rankColor = row.rank <= 3 ? medalColors[row.rank - 1] : DARK;
      summaryPage.drawText(String(row.rank), { x: cols.rank, y, size: 9, font: boldFont, color: rankColor });
      summaryPage.drawText(row.projectTitle.slice(0, 22), { x: cols.project, y, size: 9, font: regularFont, color: DARK });
      summaryPage.drawText(row.teamName.slice(0, 18), { x: cols.team, y, size: 9, font: regularFont, color: DARK });
      summaryPage.drawText(row.track.slice(0, 14), { x: cols.track, y, size: 9, font: regularFont, color: DARK });
      summaryPage.drawText(String(row.normalizedScore), { x: cols.score, y, size: 9, font: boldFont, color: DARK });
      summaryPage.drawText(String(row.judgeCount), { x: cols.judges, y, size: 9, font: regularFont, color: DARK });

      y -= 18;
    }

    // Footer
    summaryPage.drawText(`Generated: ${new Date().toUTCString()}`, {
      x: 40,
      y: 20,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // ── Pages 2-4: Individual certificates for top 3 ─────────────────────────
    const top3 = rows.slice(0, Math.min(3, rows.length));

    for (const winner of top3) {
      const certPage = pdfDoc.addPage(PageSizes.A4);
      const { width: cw, height: ch } = certPage.getSize();
      const medalColor = medalColors[winner.rank - 1];

      // Outer border
      certPage.drawRectangle({ x: 20, y: 20, width: cw - 40, height: ch - 40, borderColor: medalColor, borderWidth: 4, color: rgb(1, 1, 1) });
      certPage.drawRectangle({ x: 30, y: 30, width: cw - 60, height: ch - 60, borderColor: medalColor, borderWidth: 1, color: rgb(1, 1, 1) });

      // Header bar
      certPage.drawRectangle({ x: 20, y: ch - 120, width: cw - 40, height: 100, color: medalColor });

      certPage.drawText('CERTIFICATE OF ACHIEVEMENT', {
        x: 80,
        y: ch - 70,
        size: 22,
        font: boldFont,
        color: rgb(1, 1, 1),
      });

      certPage.drawText(medalLabels[winner.rank - 1], {
        x: 80,
        y: ch - 95,
        size: 14,
        font: boldFont,
        color: rgb(1, 1, 1),
      });

      // Body
      certPage.drawText('This certificate is awarded to', {
        x: 100,
        y: ch - 170,
        size: 13,
        font: regularFont,
        color: DARK,
      });

      certPage.drawText(`Team: ${winner.teamName}`, {
        x: 100,
        y: ch - 205,
        size: 22,
        font: boldFont,
        color: ACCENT,
      });

      certPage.drawLine({
        start: { x: 80, y: ch - 215 },
        end: { x: cw - 80, y: ch - 215 },
        thickness: 1.5,
        color: medalColor,
      });

      certPage.drawText(`Project: "${winner.projectTitle}"`, {
        x: 100,
        y: ch - 245,
        size: 14,
        font: regularFont,
        color: DARK,
      });

      certPage.drawText(`Track: ${winner.track}`, {
        x: 100,
        y: ch - 270,
        size: 12,
        font: regularFont,
        color: DARK,
      });

      certPage.drawText(`Participants: ${winner.participants}`, {
        x: 100,
        y: ch - 295,
        size: 11,
        font: regularFont,
        color: DARK,
      });

      certPage.drawText(`for outstanding performance at`, {
        x: 100,
        y: ch - 335,
        size: 13,
        font: regularFont,
        color: DARK,
      });

      certPage.drawText(hackathon.title, {
        x: 100,
        y: ch - 360,
        size: 18,
        font: boldFont,
        color: ACCENT,
      });

      // Score box
      certPage.drawRectangle({ x: cw - 170, y: ch - 290, width: 130, height: 70, color: LIGHT_BG, borderColor: medalColor, borderWidth: 2 });
      certPage.drawText('Normalized Score', { x: cw - 160, y: ch - 250, size: 8, font: regularFont, color: DARK });
      certPage.drawText(String(winner.normalizedScore), { x: cw - 145, y: ch - 270, size: 20, font: boldFont, color: medalColor });

      // Date and signature area
      certPage.drawText(`Date: ${new Date().toDateString()}`, {
        x: 100,
        y: 100,
        size: 11,
        font: regularFont,
        color: DARK,
      });

      certPage.drawLine({ start: { x: cw - 200, y: 100 }, end: { x: cw - 60, y: 100 }, thickness: 1, color: DARK });
      certPage.drawText('Organizer Signature', { x: cw - 190, y: 85, size: 9, font: regularFont, color: rgb(0.5, 0.5, 0.5) });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
