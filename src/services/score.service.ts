import { FastifyInstance } from 'fastify';
import { SubmitScoresPayload } from '../schemas/score.schema';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { LeaderboardService } from './leaderboard.service';
import { broadcastLeaderboardUpdate } from '../controllers/leaderboard.controller';


export class ScoreService {
  constructor(private app: FastifyInstance) {}

  /**
   * Submit or update scores for a project
   */
  async submitScores(projectId: string, judgeId: string, data: SubmitScoresPayload) {
    const project = await this.app.prisma.project.findUnique({
      where: { id: projectId },
      include: { team: true },
    });

    if (!project) throw new NotFoundError('Project not found');
    if (project.status !== 'SUBMITTED' && project.status !== 'UNDER_REVIEW') {
      throw new BadRequestError('Project is not ready for judging or judging is closed.');
    }

    // Checking JudgeConflict
    const conflict = await this.app.prisma.judgeConflict.findUnique({
      where: { judgeId_teamId: { judgeId, teamId: project.teamId } }
    });

    if (conflict && !conflict.overridden) {
      throw new ForbiddenError('You have a declared conflict of interest with this team');
    }

    // Checking if judge is in the team
    const inTeam = await this.app.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: project.teamId, userId: judgeId } }
    });

    if (inTeam) {
      throw new ForbiddenError('You cannot judge your own team');
    }

    // Get track criteria to validate max scores & weights
    const trackId = project.team.trackId;
    if (!trackId) {
      throw new BadRequestError('Project team must select a track before judging');
    }

    const criteriaList = await this.app.prisma.criteria.findMany({
      where: { trackId, id: { in: data.scores.map(s => s.criteriaId) } },
    });

    const criteriaMap = new Map(criteriaList.map(c => [c.id, c]));

    // Transaction execution
    return await this.app.prisma.$transaction(async (tx) => {
      for (const scoreData of data.scores) {
        const criteria = criteriaMap.get(scoreData.criteriaId);
        if (!criteria) {
          throw new BadRequestError(`Invalid criteria ID: ${scoreData.criteriaId}`);
        }
        
        if (scoreData.scoreValue > Number(criteria.maxScore)) {
          throw new BadRequestError(`Score ${scoreData.scoreValue} exceeds max score ${criteria.maxScore} for criteria ${criteria.name}`);
        }

        await tx.score.upsert({
          where: { judgeId_projectId_criteriaId: { judgeId, projectId, criteriaId: scoreData.criteriaId } },
          update: { scoreValue: scoreData.scoreValue, comment: scoreData.comment },
          create: { judgeId, projectId, criteriaId: scoreData.criteriaId, scoreValue: scoreData.scoreValue, comment: scoreData.comment },
        });
      }

      // 1. Calculate the new raw weighted average for the project
      // Note: A real average might involve averaging weights * scores / number of judges
      // Here we fetch all scores for the project to cache the overall score.
      const allProjectScores = await tx.score.findMany({
        where: { projectId },
        include: { criteria: true },
      });

      // Summation logic: Sum of (Score * Weight) across all criteria
      let totalRawScore = 0;
      let totalWeight = 0;

      for (const s of allProjectScores) {
        const value = Number(s.scoreValue);
        const weight = Number(s.criteria.weight);
        totalRawScore += value * weight;
        totalWeight += weight;
      }

      // Calculate average if there are scores
      let averageScore = 0;
      if (totalWeight > 0) {
        // Average score per weight relative to total max weights
        // Simplest definition: totalRawScore divided by number of unique judges
        const judgeIds = new Set(allProjectScores.map(s => s.judgeId));
        averageScore = totalRawScore / judgeIds.size;
      }

      // Update the project's cached score fields
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          totalScore: totalRawScore,
          averageScore: averageScore,
          status: 'UNDER_REVIEW', // Automatically transition status if evaluated
        },
      });

      // Background: Invalidate and broadcast leaderboard updates
      const leaderboardService = new LeaderboardService(this.app);
      leaderboardService.invalidateCache(project.team.hackathonId).then(() => {
        broadcastLeaderboardUpdate(this.app, project.team.hackathonId);
      }).catch(err => this.app.log.error(err, 'Failed to update leaderboard after score submission'));

      return {
        message: 'Scores successfully submitted',
        projectStatus: updatedProject.status,
        averageScore: updatedProject.averageScore,
      };
    });
  }

  /**
   * Get scores for a project (with Z-Score normalization)
   */
  async getProjectScores(projectId: string, judgeId?: string) {
    // 1. Get raw scores for the project
    const whereClause: any = { projectId };
    if (judgeId) whereClause.judgeId = judgeId;

    const scores = await this.app.prisma.score.findMany({
      where: whereClause,
      include: { criteria: true },
    });

    if (!scores.length) {
      return { scores: [], normalizedAverage: 0 };
    }

    // 2. Perform Z-score normalization dynamically per judge
    const judgeIds = [...new Set(scores.map(s => s.judgeId))];
    const judgeStats = new Map<string, { mean: number, stdDev: number }>();

    for (const jId of judgeIds) {
      // Find all scores this judge has EVER given
      const judgeTotalScores = await this.app.prisma.score.findMany({
        where: { judgeId: jId },
      });

      if (judgeTotalScores.length <= 1) {
        // Cannot compute stdDev with <= 1 element, z-score is baseline 0
        judgeStats.set(jId, { mean: Number(judgeTotalScores[0]?.scoreValue || 0), stdDev: 1 });
        continue;
      }

      const values = judgeTotalScores.map(s => Number(s.scoreValue));
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1);
      const stdDev = Math.sqrt(variance) || 1; // avoid division by 0

      judgeStats.set(jId, { mean, stdDev });
    }

    let zScoreSum = 0;

    const enrichedScores = scores.map(s => {
      const stats = judgeStats.get(s.judgeId)!;
      const val = Number(s.scoreValue);
      const zScore = (val - stats.mean) / stats.stdDev;
      
      zScoreSum += zScore * Number(s.criteria.weight);

      return {
        ...s,
        zScore,
      };
    });

    return {
      scores: enrichedScores,
    };
  }
}
