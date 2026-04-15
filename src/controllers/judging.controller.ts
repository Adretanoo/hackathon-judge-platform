import { FastifyRequest, FastifyReply } from 'fastify';
import { ProjectService } from '../services/project.service';
import { ScoreService } from '../services/score.service';
import { AIService } from '../services/ai.service';
import { successResponse } from '../utils/response';
import { ProjectStatus } from '@prisma/client';

export async function listJudgingProjectsHandler(req: FastifyRequest<{ Querystring: { hackathonId: string } }>, reply: FastifyReply) {
  const service = new ProjectService(req.server);
  const judgeId = (req.user as any)!.sub;
  const { hackathonId } = req.query;

  const result = await service.listProjects(1, 100, {
    hackathonId,
    judgeId,
    statuses: [ProjectStatus.SUBMITTED, ProjectStatus.UNDER_REVIEW, ProjectStatus.ACCEPTED]
  });

  const mappedItems = result.items.map((p: any) => {
    const scores = p.scores || [];
    const isScored = scores.length > 0;
    const myScore = isScored ? scores.reduce((sum: number, s: any) => sum + Number(s.scoreValue), 0) : null;
    return {
      ...p,
      isScored,
      myScore,
      scores: undefined // remove raw scores from response body
    };
  });

  return reply.status(200).send(successResponse({
    ...result,
    items: mappedItems
  }));
}

export async function listJudgingHackathonsHandler(req: FastifyRequest, reply: FastifyReply) {
  const judgeId = (req.user as any)!.sub;
  const assignments = await req.server.prisma.judgeAssignment.findMany({
    where: { judgeId },
    distinct: ['hackathonId'],
    include: {
      hackathon: {
        select: { id: true, title: true, status: true, startDate: true, endDate: true }
      }
    }
  }) as any;

  const hackathons = assignments.map((a: any) => a.hackathon);
  return reply.status(200).send(successResponse(hackathons));
}

export async function getJudgingStatsHandler(req: FastifyRequest, reply: FastifyReply) {
  const service = new ScoreService(req.server);
  const judgeId = (req.user as any)!.sub;
  const stats = await service.getJudgeStats(judgeId);
  return reply.status(200).send(successResponse(stats));
}

export async function autoEvaluateProjectHandler(req: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) {
  const service = new AIService(req.server);
  const { projectId } = req.params;
  
  const result = await service.evaluateProject(projectId);
  return reply.status(200).send(successResponse(result));
}
