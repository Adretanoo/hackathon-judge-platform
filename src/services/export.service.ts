/**
 * @file src/services/export.service.ts
 * @description CSV and PDF export service for hackathon results.
 *
 * NOTE: pdf-lib standard fonts (Helvetica) use WinAnsi encoding which only
 * supports Latin characters. All Cyrillic text is transliterated to ASCII
 * before being written to the PDF.
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
  // Cyrillic → Latin transliteration (WinAnsi safe)
  // ---------------------------------------------------------------------------

  private sanitize(text: string): string {
    if (!text) return '';
    const map: Record<string, string> = {
      'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','є':'ye','ж':'zh',
      'з':'z','и':'i','і':'i','ї':'yi','й':'y','к':'k','л':'l','м':'m',
      'н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
      'х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ь':'','ю':'yu','я':'ya',
      'ё':'yo','э':'e','ъ':'',
      'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Є':'Ye','Ж':'Zh',
      'З':'Z','И':'I','І':'I','Ї':'Yi','Й':'Y','К':'K','Л':'L','М':'M',
      'Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F',
      'Х':'Kh','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Shch','Ь':'','Ю':'Yu','Я':'Ya',
    };
    return text.split('').map(ch => map[ch] ?? (ch.charCodeAt(0) > 127 ? '?' : ch)).join('');
  }

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
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'DRAFT'] },
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
    const rows: (ExportRow & { _normalized: number })[] = (projects as any[]).map((proj) => {
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
        participants: proj.team.members.map((m: any) => m.user.username).join('; '),
        _normalized: normalizedTotal,
      };
    });

    // Sort and assign rank
    rows.sort((a, b) => b._normalized - a._normalized);
    rows.forEach((r, i) => { r.rank = i + 1; });

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

    const header =
      `# Hackathon: ${hackathon.title}\n` +
      `# Period: ${hackathon.startDate.toISOString().slice(0, 10)} - ${hackathon.endDate.toISOString().slice(0, 10)}\n` +
      `# Exported: ${new Date().toISOString()}\n\n`;

    return Buffer.from(header + csv, 'utf-8');
  }

  // ---------------------------------------------------------------------------
  // PDF export — leaderboard summary page + certificates for top-3
  // NOTE: All text is sanitized via this.sanitize() to avoid WinAnsi errors
  // ---------------------------------------------------------------------------

  async exportPdf(hackathonId: string): Promise<Buffer> {
    const { hackathon, rows } = await this.buildLeaderboardData(hackathonId);

    const pdfDoc = await PDFDocument.create();
    const boldFont   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const GOLD     = rgb(0.83, 0.68, 0.21);
    const SILVER   = rgb(0.55, 0.55, 0.55);
    const BRONZE   = rgb(0.72, 0.45, 0.2);
    const DARK     = rgb(0.1,  0.1,  0.1);
    const ACCENT   = rgb(0.25, 0.35, 0.8);
    const LIGHT_BG = rgb(0.97, 0.97, 1.0);
    const WHITE    = rgb(1, 1, 1);

    const medalColors = [GOLD, SILVER, BRONZE];
    const medalLabels = ['1st Place', '2nd Place', '3rd Place'];

    const safeTitle = this.sanitize(hackathon.title);

    // ── Page 1: Leaderboard summary ─────────────────────────────────────────
    const summaryPage = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = summaryPage.getSize();

    summaryPage.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: ACCENT });

    summaryPage.drawText('Hackathon Results', {
      x: 40, y: height - 48, size: 28, font: boldFont, color: WHITE,
    });
    summaryPage.drawText(safeTitle, {
      x: 40, y: height - 70, size: 12, font: regularFont, color: rgb(0.85, 0.85, 1),
    });
    summaryPage.drawText(
      `${hackathon.startDate.toDateString()} - ${hackathon.endDate.toDateString()}`,
      { x: width - 260, y: height - 58, size: 9, font: regularFont, color: rgb(0.85, 0.85, 1) },
    );

    // Column headers
    let y = height - 110;
    const cols = { rank: 40, project: 75, team: 210, track: 320, score: 420, judges: 490 };

    summaryPage.drawRectangle({ x: 30, y: y - 4, width: width - 60, height: 20, color: ACCENT });
    const headerCols: [string, number][] = [
      ['#', cols.rank], ['Project', cols.project], ['Team', cols.team],
      ['Track', cols.track], ['Score', cols.score], ['Judges', cols.judges],
    ];
    for (const [label, x] of headerCols) {
      summaryPage.drawText(label, { x, y, size: 9, font: boldFont, color: WHITE });
    }
    y -= 24;

    if (rows.length === 0) {
      summaryPage.drawText('No evaluated projects found.', {
        x: 40, y, size: 12, font: regularFont, color: DARK,
      });
    }

    for (const row of rows) {
      if (y < 60) break;

      if (row.rank % 2 === 0) {
        summaryPage.drawRectangle({ x: 30, y: y - 4, width: width - 60, height: 16, color: LIGHT_BG });
      }

      const rankColor = row.rank <= 3 ? medalColors[row.rank - 1] : DARK;
      const safeProject = this.sanitize(row.projectTitle).slice(0, 22);
      const safeTeam    = this.sanitize(row.teamName).slice(0, 18);
      const safeTrack   = this.sanitize(row.track).slice(0, 14);

      summaryPage.drawText(String(row.rank),         { x: cols.rank,    y, size: 9, font: boldFont,    color: rankColor });
      summaryPage.drawText(safeProject,               { x: cols.project, y, size: 9, font: regularFont, color: DARK });
      summaryPage.drawText(safeTeam,                  { x: cols.team,    y, size: 9, font: regularFont, color: DARK });
      summaryPage.drawText(safeTrack,                 { x: cols.track,   y, size: 9, font: regularFont, color: DARK });
      summaryPage.drawText(String(row.normalizedScore),{ x: cols.score,   y, size: 9, font: boldFont,    color: DARK });
      summaryPage.drawText(String(row.judgeCount),    { x: cols.judges,  y, size: 9, font: regularFont, color: DARK });
      y -= 18;
    }

    // Statistics footer on page 1
    if (rows.length > 0) {
      y = Math.min(y - 10, 120);
      summaryPage.drawLine({ start: { x: 30, y }, end: { x: width - 30, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
      summaryPage.drawText(`Total projects: ${rows.length}`, { x: 40, y: y - 16, size: 9, font: regularFont, color: DARK });
      if (rows[0]) {
        summaryPage.drawText(`Top score: ${rows[0].normalizedScore}  (${this.sanitize(rows[0].teamName)})`, {
          x: 40, y: y - 30, size: 9, font: regularFont, color: DARK,
        });
      }
    }

    summaryPage.drawText(`Generated: ${new Date().toUTCString()}`, {
      x: 40, y: 20, size: 8, font: regularFont, color: rgb(0.5, 0.5, 0.5),
    });

    // ── Pages 2-N: Individual certificates for top 3 ────────────────────────
    const top3 = rows.slice(0, Math.min(3, rows.length));

    for (const winner of top3) {
      const certPage = pdfDoc.addPage(PageSizes.A4);
      const { width: cw, height: ch } = certPage.getSize();
      const medalColor = medalColors[winner.rank - 1];

      const safeTeamName = this.sanitize(winner.teamName);
      const safeProjTitle = this.sanitize(winner.projectTitle);
      const safeTrackName = this.sanitize(winner.track);
      const safeParticipants = this.sanitize(winner.participants);
      const truncParticipants = safeParticipants.length > 68 ? safeParticipants.slice(0, 68) + '...' : safeParticipants;

      // Borders
      certPage.drawRectangle({ x: 20, y: 20, width: cw - 40, height: ch - 40, borderColor: medalColor, borderWidth: 4, color: WHITE });
      certPage.drawRectangle({ x: 30, y: 30, width: cw - 60, height: ch - 60, borderColor: medalColor, borderWidth: 1, color: WHITE });

      // Header
      certPage.drawRectangle({ x: 20, y: ch - 120, width: cw - 40, height: 100, color: medalColor });
      certPage.drawText('CERTIFICATE OF ACHIEVEMENT', { x: 70, y: ch - 68, size: 22, font: boldFont, color: WHITE });
      certPage.drawText(medalLabels[winner.rank - 1],  { x: 70, y: ch - 92, size: 14, font: boldFont, color: WHITE });

      // Body
      certPage.drawText('This certificate is awarded to', { x: 100, y: ch - 165, size: 13, font: regularFont, color: DARK });
      certPage.drawText(`Team: ${safeTeamName}`,          { x: 100, y: ch - 198, size: 22, font: boldFont,    color: ACCENT });

      certPage.drawLine({ start: { x: 80, y: ch - 210 }, end: { x: cw - 80, y: ch - 210 }, thickness: 1.5, color: medalColor });

      certPage.drawText(`Project: "${safeProjTitle}"`,   { x: 100, y: ch - 238, size: 13, font: regularFont, color: DARK });
      certPage.drawText(`Track: ${safeTrackName}`,       { x: 100, y: ch - 260, size: 11, font: regularFont, color: DARK });
      certPage.drawText(`Participants: ${truncParticipants}`, { x: 100, y: ch - 282, size: 10, font: regularFont, color: DARK });

      certPage.drawText('for outstanding performance at', { x: 100, y: ch - 322, size: 12, font: regularFont, color: DARK });
      certPage.drawText(this.sanitize(hackathon.title).slice(0, 50), { x: 100, y: ch - 346, size: 17, font: boldFont, color: ACCENT });

      // Score box
      certPage.drawRectangle({ x: cw - 168, y: ch - 286, width: 128, height: 66, color: LIGHT_BG, borderColor: medalColor, borderWidth: 2 });
      certPage.drawText('Normalized Score', { x: cw - 158, y: ch - 248, size: 8, font: regularFont, color: DARK });
      certPage.drawText(String(winner.normalizedScore), { x: cw - 143, y: ch - 268, size: 20, font: boldFont, color: medalColor });

      // Signature area
      certPage.drawText(`Date: ${new Date().toDateString()}`, { x: 100, y: 100, size: 11, font: regularFont, color: DARK });
      certPage.drawLine({ start: { x: cw - 200, y: 100 }, end: { x: cw - 60, y: 100 }, thickness: 1, color: DARK });
      certPage.drawText('Organizer Signature', { x: cw - 192, y: 85, size: 9, font: regularFont, color: rgb(0.5, 0.5, 0.5) });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
