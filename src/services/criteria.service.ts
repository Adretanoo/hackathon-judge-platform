import { FastifyInstance } from 'fastify';
import { CreateCriteriaPayload, UpdateCriteriaPayload } from '../schemas/criteria.schema';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { RoleName } from '@prisma/client';

export class CriteriaService {
  constructor(private app: FastifyInstance) {}

  /**
   * Helper to verify if the user is authorized to manage the hackathon.
   * Checks DB for GLOBAL_ADMIN so it works even when JWT is stale.
   */
  private async requireHackathonAdmin(hackathonId: string, userId: string, hasGlobalAdmin: boolean): Promise<void> {
    // Fast path: JWT already says GLOBAL_ADMIN
    if (hasGlobalAdmin) return;

    // DB fallback: check if user has GLOBAL_ADMIN role in DB
    const dbAdminRole = await this.app.prisma.userRole.findFirst({
      where: { userId, roleName: RoleName.GLOBAL_ADMIN, hackathonId: null },
    });
    if (dbAdminRole) return;

    // Check if user is the organizer of this hackathon
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
   * Delete a criterion by ID (organizer or GLOBAL_ADMIN only)
   */
  async deleteCriteria(hackathonId: string, criterionId: string, userId: string, hasGlobalAdmin: boolean) {
    await this.requireHackathonAdmin(hackathonId, userId, hasGlobalAdmin);

    const criterion = await this.app.prisma.criteria.findUnique({
      where: { id: criterionId },
      include: { track: { select: { hackathonId: true } } },
    });

    if (!criterion || criterion.track.hackathonId !== hackathonId) {
      throw new NotFoundError('Criterion not found in this hackathon');
    }

    await this.app.prisma.criteria.delete({ where: { id: criterionId } });
    return { deleted: true };
  }

  /**
   * Update an existing criterion (organizer or GLOBAL_ADMIN only)
   */
  async updateCriteria(hackathonId: string, criterionId: string, userId: string, hasGlobalAdmin: boolean, data: UpdateCriteriaPayload) {
    await this.requireHackathonAdmin(hackathonId, userId, hasGlobalAdmin);

    const criterion = await this.app.prisma.criteria.findUnique({
      where: { id: criterionId },
      include: { track: { select: { hackathonId: true } } },
    });

    if (!criterion || criterion.track.hackathonId !== hackathonId) {
      throw new NotFoundError('Criterion not found in this hackathon');
    }

    return await this.app.prisma.criteria.update({
      where: { id: criterionId },
      data,
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
    
    if (!project.team.trackId) {
      return [];
    }

    return await this.app.prisma.criteria.findMany({
      where: { trackId: project.team.trackId },
    });
  }
}
