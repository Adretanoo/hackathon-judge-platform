import { FastifyInstance } from 'fastify';
import { ProjectStatus, TeamMemberRole } from '@prisma/client';
import { CreateProjectPayload, UpdateProjectPayload } from '../schemas/project.schema';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export class ProjectService {
  constructor(private app: FastifyInstance) {}

  /**
   * Ensures user is a CAPTAIN of the team (or an ORGANIZER/ADMIN).
   * Only captains can create or modify projects.
   */
  private async requireCaptainAccess(teamId: string, userId: string): Promise<void> {
    const membership = await this.app.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (membership?.role === TeamMemberRole.CAPTAIN) {
      return; // ✅ Captain — allowed
    }

    // Fallback: allow ORGANIZER/GLOBAL_ADMIN
    const team = await this.app.prisma.team.findUnique({ where: { id: teamId } });
    const roles = await this.app.prisma.userRole.findMany({ where: { userId } });
    const isOrganizer = roles.some(
      r => r.roleName === 'GLOBAL_ADMIN' ||
           (r.roleName === 'ORGANIZER' && r.hackathonId === team?.hackathonId)
    );

    if (!isOrganizer) {
      if (!membership) {
        throw new ForbiddenError('You are not a member of this team');
      }
      throw new ForbiddenError('Only the team captain can create or modify the project');
    }
  }

  /**
   * Create a new project for a team
   */
  async createProject(userId: string, data: CreateProjectPayload) {
    await this.requireCaptainAccess(data.teamId, userId);

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
        resources: data.resources ? {
          create: data.resources
        } : undefined,
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
    await this.requireCaptainAccess(project.teamId, userId);

    return await this.app.prisma.project.update({
      where: { id: projectId },
      data: {
        title: data.title,
        description: data.description,
        repoUrl: data.repoUrl,
        demoUrl: data.demoUrl,
        videoUrl: data.videoUrl,
        techStack: data.techStack,
        resources: data.resources ? {
          deleteMany: {},
          create: data.resources
        } : undefined,
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
      await this.requireCaptainAccess(project.teamId, userId);
      // Only allow team to change status from DRAFT -> SUBMITTED or SUBMITTED -> DRAFT
      if (
        status !== ProjectStatus.SUBMITTED && 
        status !== ProjectStatus.DRAFT
      ) {
        throw new ForbiddenError('Teams can only submit or unsubmit their projects');
      }

      // If submitting, enforce minTeamSize
      if (status === ProjectStatus.SUBMITTED) {
        const teamWithHackathon = await this.app.prisma.team.findUnique({
          where: { id: project.teamId },
          include: { 
            hackathon: true,
            _count: { select: { members: true } }
          }
        });

        if (teamWithHackathon && teamWithHackathon._count.members < teamWithHackathon.hackathon.minTeamSize) {
          throw new BadRequestError(`Cannot submit project: your team must have at least ${teamWithHackathon.hackathon.minTeamSize} members.`);
        }
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
        resources: true,
      }
    });

    if (!project) throw new NotFoundError('Project not found');
    return project;
  }

  /**
   * List projects, with optional filtering by hackathon, team, status, or judge.
   * When judgeId is present, DISQUALIFIED teams are excluded automatically.
   */
  async listProjects(page: number, limit: number, filters: { teamId?: string; hackathonId?: string; judgeId?: string; status?: ProjectStatus; statuses?: ProjectStatus[] }) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.teamId) where.teamId = filters.teamId;
    if (filters.status) where.status = filters.status;
    if (filters.statuses) where.status = { in: filters.statuses };
    
    if (filters.judgeId) {
      // Find what this judge is allowed to see in this hackathon
      const assignments = await this.app.prisma.judgeAssignment.findMany({
        where: { 
          judgeId: filters.judgeId,
          hackathonId: filters.hackathonId
        }
      });

      if (assignments.length > 0) {
        const trackIds = assignments.map(a => a.trackId).filter(id => id !== null);
        const hasGlobalAssignment = assignments.some(a => a.trackId === null);

        // Exclude DISQUALIFIED teams from judging view
        where.team = { 
          hackathonId: filters.hackathonId,
          status: { not: 'DISQUALIFIED' },
        };
        
        if (!hasGlobalAssignment && trackIds.length > 0) {
          where.team.trackId = { in: trackIds };
        }
      } else {
        // Fallback: show all non-disqualified projects in hackathon
        where.team = { 
          hackathonId: filters.hackathonId,
          status: { not: 'DISQUALIFIED' },
        };
      }
    } else if (filters.hackathonId) {
      where.team = { hackathonId: filters.hackathonId };
    }

    const [items, total] = await Promise.all([
      this.app.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          team: { select: { hackathonId: true, trackId: true, name: true, status: true } },
          scores: filters.judgeId ? { where: { judgeId: filters.judgeId } } : false
        }
      }),
      this.app.prisma.project.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
