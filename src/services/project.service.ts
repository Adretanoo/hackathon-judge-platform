import { FastifyInstance } from 'fastify';
import { ProjectStatus } from '@prisma/client';
import { CreateProjectPayload, UpdateProjectPayload } from '../schemas/project.schema';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export class ProjectService {
  constructor(private app: FastifyInstance) {}

  /**
   * Helper: Check if user is legally allowed to modify a project on behalf of a team.
   */
  private async requireTeamAccess(teamId: string, userId: string): Promise<void> {
    const membership = await this.app.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this team');
    }
  }

  /**
   * Create a new project for a team
   */
  async createProject(userId: string, data: CreateProjectPayload) {
    await this.requireTeamAccess(data.teamId, userId);

    // Ensure they don't already have a project
    const existingProject = await this.app.prisma.project.findFirst({
      where: { teamId: data.teamId },
    });
    
    if (existingProject) {
      throw new BadRequestError('This team already has a project');
    }

    return await this.app.prisma.project.create({
      data: {
        teamId: data.teamId,
        title: data.title,
        description: data.description,
        repoUrl: data.repoUrl,
        demoUrl: data.demoUrl,
        videoUrl: data.videoUrl,
        techStack: data.techStack || [],
        status: ProjectStatus.DRAFT,
      },
    });
  }

  /**
   * Update an existing project
   */
  async updateProject(projectId: string, userId: string, data: UpdateProjectPayload) {
    const project = await this.app.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundError('Project not found');
    await this.requireTeamAccess(project.teamId, userId);

    return await this.app.prisma.project.update({
      where: { id: projectId },
      data: {
        title: data.title,
        description: data.description,
        repoUrl: data.repoUrl,
        demoUrl: data.demoUrl,
        videoUrl: data.videoUrl,
        techStack: data.techStack,
      },
    });
  }

  /**
   * Change status of a project (e.g. submit)
   */
  async changeStatus(projectId: string, userId: string, status: ProjectStatus, hasAdminAccess: boolean = false) {
    const project = await this.app.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundError('Project not found');

    if (!hasAdminAccess) {
      await this.requireTeamAccess(project.teamId, userId);
      // Only allow team to change status from DRAFT -> SUBMITTED or SUBMITTED -> DRAFT
      if (
        status !== ProjectStatus.SUBMITTED && 
        status !== ProjectStatus.DRAFT
      ) {
        throw new ForbiddenError('Teams can only submit or unsubmit their projects');
      }
    }

    return await this.app.prisma.project.update({
      where: { id: projectId },
      data: { 
        status,
        submittedAt: status === ProjectStatus.SUBMITTED ? new Date() : undefined,
      },
    });
  }

  /**
   * Get project details
   */
  async getProject(projectId: string) {
    const project = await this.app.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          select: { name: true, trackId: true }
        },
      }
    });

    if (!project) throw new NotFoundError('Project not found');
    return project;
  }

  /**
   * List projects
   */
  async listProjects(page: number, limit: number, filters: { teamId?: string; hackathonId?: string; status?: ProjectStatus }) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.teamId) where.teamId = filters.teamId;
    if (filters.status) where.status = filters.status;
    if (filters.hackathonId) {
      where.team = { hackathonId: filters.hackathonId };
    }

    const [items, total] = await Promise.all([
      this.app.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          team: { select: { hackathonId: true, trackId: true } },
        }
      }),
      this.app.prisma.project.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
