import { FastifyInstance } from 'fastify';
import { CreateCriteriaPayload } from '../schemas/criteria.schema';
import { NotFoundError, ForbiddenError } from '../utils/errors';


export class CriteriaService {
  constructor(private app: FastifyInstance) {}

  /**
   * Helper to verify if the user is authorized to manage the hackathon.
   */
  private async requireHackathonAdmin(hackathonId: string, userId: string, hasGlobalAdmin: boolean): Promise<void> {
    if (hasGlobalAdmin) return;
    const hackathon = await this.app.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundError('Hackathon not found');
    if (hackathon.organizerId !== userId) {
      throw new ForbiddenError('You are not authorized to manage criteria for this hackathon');
    }
  }

  /**
   * Create a new criterion for a track
   */
  async createCriteria(hackathonId: string, userId: string, hasGlobalAdmin: boolean, data: CreateCriteriaPayload) {
    await this.requireHackathonAdmin(hackathonId, userId, hasGlobalAdmin);

    // Verify track belongs to the hackathon
    const track = await this.app.prisma.track.findUnique({ where: { id: data.trackId } });
    if (!track || track.hackathonId !== hackathonId) {
      throw new NotFoundError('Track not found in this hackathon');
    }

    return await this.app.prisma.criteria.create({
      data: {
        trackId: data.trackId,
        name: data.name,
        description: data.description,
        weight: data.weight,
        maxScore: data.maxScore,
        orderIndex: data.orderIndex,
      },
    });
  }

  /**
   * Get criteria for a hackathon
   */
  async getCriteriaForHackathon(hackathonId: string) {
    return await this.app.prisma.criteria.findMany({
      where: { track: { hackathonId } },
      include: { track: { select: { name: true } } },
      orderBy: [
        { trackId: 'asc' },
        { orderIndex: 'asc' },
      ],
    });
  }

  /**
   * Get criteria specifically for a project (based on its track)
   */
  async getCriteriaForProject(projectId: string) {
    const project = await this.app.prisma.project.findUnique({
      where: { id: projectId },
      include: { team: { select: { trackId: true } } },
    });
    
    if (!project) throw new NotFoundError('Project not found');
    
    // If the team hasn't selected a track, we return an empty array or handle error
    if (!project.team.trackId) {
      return [];
    }

    return await this.app.prisma.criteria.findMany({
      where: { trackId: project.team.trackId },
    });
  }
}
