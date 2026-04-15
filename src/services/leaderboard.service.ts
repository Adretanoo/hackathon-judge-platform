import { FastifyInstance } from 'fastify';
import { LeaderboardResponse, ProjectLeaderboardEntry } from '../schemas/leaderboard.schema';
import { NotFoundError } from '../utils/errors';

export class LeaderboardService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(private app: FastifyInstance) {}

  /**
   * Get leaderboard for a hackathon
   */
  async getLeaderboard(hackathonId: string, trackId?: string): Promise<LeaderboardResponse> {
    const cacheKey = trackId 
      ? `leaderboard:hackathon:${hackathonId}:track:${trackId}`
      : `leaderboard:hackathon:${hackathonId}`;

    // 1. Try to get from cache (Redis may be unavailable)
    try {
      const cached = await this.app.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Redis unavailable — compute fresh
    }

    // 2. Compute leaderboard
    const leaderboard = await this.computeLeaderboard(hackathonId, trackId);

    // 3. Save to cache (best-effort)
    try {
      await this.app.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(leaderboard));
    } catch {
      // ignore cache write failures
    }

    return leaderboard;
  }

  /**
   * Calculate normalized scores and build the leaderboard
   */
  private async computeLeaderboard(hackathonId: string, trackId?: string): Promise<LeaderboardResponse> {
    const hackathon = await this.app.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) throw new NotFoundError('Hackathon not found');

    // Fetch projects and their scores — include ALL statuses so drafts show up too
    const projects = await this.app.prisma.project.findMany({
      where: {
        team: {
          hackathonId,
          ...(trackId && { trackId }),
        },
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'DRAFT'] },
      },
      include: {
        team: {
          include: { track: true }
        },
        scores: {
          include: { criteria: true },
        },
      },
    }) as any[];

    // 1. Get all judge stats for normalization
    // We need statistics for ALL judges that evaluated ANY project in this hackathon
    const allScores = await this.app.prisma.score.findMany({
      where: {
        project: {
          team: { hackathonId }
        }
      }
    });

    const judgeScoresMap = new Map<string, number[]>();
    for (const s of allScores) {
      const val = Number(s.scoreValue);
      if (!judgeScoresMap.has(s.judgeId)) judgeScoresMap.set(s.judgeId, []);
      judgeScoresMap.get(s.judgeId)!.push(val);
    }

    const judgeStats = new Map<string, { mean: number; stdDev: number }>();
    for (const [judgeId, values] of judgeScoresMap.entries()) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.length > 1 
        ? values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1)
        : 0;
      const stdDev = Math.sqrt(variance) || 1; // avoid division by 0
      judgeStats.set(judgeId, { mean, stdDev });
    }

    // 2. Calculate normalized score for each project
    const entries: ProjectLeaderboardEntry[] = projects.map(proj => {
      let normalizedTotal = 0;

      for (const s of proj.scores) {
        const stats = judgeStats.get(s.judgeId) ?? { mean: 0, stdDev: 1 };
        const val = Number(s.scoreValue);
        const weight = Number(s.criteria.weight);
        
        // Z-score: (value - mean) / stdDev
        const zScore = (val - stats.mean) / stats.stdDev;
        normalizedTotal += zScore * weight;
      }

      return {
        projectId: proj.id,
        projectTitle: proj.title,
        teamName: proj.team.name,
        track: proj.team.track?.name || 'Global',
        totalRawScore: Number(proj.totalScore || 0),
        averageRawScore: Number(proj.averageScore || 0),
        normalizedScore: normalizedTotal,
        judgeCount: new Set(proj.scores.map((s: any) => s.judgeId)).size,
        rank: 0, // Will be set later
      };
    });

    // 3. Sort by normalized score desc
    entries.sort((a, b) => b.normalizedScore - a.normalizedScore);

    // 4. Set rank
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return {
      hackathonId,
      trackId,
      lastUpdated: new Date().toISOString(),
      entries,
    };
  }

  /**
   * Invalidate cache for a hackathon
   */
  async invalidateCache(hackathonId: string) {
    // We use a pattern to delete both the main hackathon leaderboard and track-specific ones
    const keys = await this.app.redis.keys(`leaderboard:hackathon:${hackathonId}*`);
    if (keys.length > 0) {
      await this.app.redis.del(...keys);
    }
  }
}
