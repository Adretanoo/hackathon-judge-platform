import { FastifyRequest, FastifyReply } from 'fastify';
import { ScoreService } from '../services/score.service';
import { successResponse } from '../utils/response';
import { SubmitScoresPayload } from '../schemas/score.schema';

export async function submitScoresHandler(
  req: FastifyRequest<{ Params: { projectId: string }; Body: SubmitScoresPayload }>, 
  reply: FastifyReply
) {
  const service = new ScoreService(req.server);
  const judgeId = (req.user as any)!.sub;
  
  const result = await service.submitScores(req.params.projectId, judgeId, req.body);
  return reply.status(200).send(successResponse(result));
}

export async function getProjectScoresHandler(
  req: FastifyRequest<{ Params: { projectId: string }, Querystring: { judgeId?: string } }>, 
  reply: FastifyReply
) {
  const service = new ScoreService(req.server);
  const { judgeId } = req.query;

  const result = await service.getProjectScores(req.params.projectId, judgeId);
  return reply.status(200).send(successResponse(result));
}
