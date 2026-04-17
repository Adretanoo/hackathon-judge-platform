/**
 * @file src/services/hackathon.service.ts
 * @description Business logic for Hackathons and their related sub-entities.
 */

import { PrismaClient, HackathonStatus, RoleName } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';
import type { 
  CreateHackathonBody, UpdateHackathonBody, ChangeHackathonStatusBody,
  CreateStageBody, UpdateStageBody, CreateTrackBody, UpdateTrackBody,
  CreateAwardBody, UpdateAwardBody
} from '../schemas/hackathon.schema';

export class HackathonService {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Hackathons ─────────────────────────────────────────────────────────────

  async createHackathon(organizerId: string, data: CreateHackathonBody) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the Hackathon
      const hackathon = await tx.hackathon.create({
        data: {
          ...data,
          organizerId,
          status: HackathonStatus.DRAFT, // Always start as DRAFT
        },
      });

      // 2. Grant the creator contextual organizer privileges
      await tx.userRole.create({
        data: {
          userId: organizerId,
          roleName: RoleName.ORGANIZER,
          hackathonId: hackathon.id,
        }
      });

      return hackathon;
    });
  }

  async getHackathonById(id: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { orderIndex: 'asc' } },
        tracks: true,
        awards: { orderBy: { rank: 'asc' } },
        organizer: {
          select: { id: true, username: true, fullName: true, avatarUrl: true }
        }
      }
    });

    if (!hackathon) {
      throw new NotFoundError('Hackathon not found');
    }

    return hackathon;
  }

  async listHackathons(page: number = 1, limit: number = 20, showAll = false, search?: string) {
    const skip = (page - 1) * limit;

    // Public listing excludes DRAFT/ARCHIVED; admin passes showAll=true to see everything
    const filter: any = showAll ? {} : {
      status: { notIn: [HackathonStatus.DRAFT, HackathonStatus.ARCHIVED] }
    };

    if (search) {
      filter.title = { contains: search, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      this.prisma.hackathon.count({ where: filter }),
      this.prisma.hackathon.findMany({
        where: filter,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { teams: true } } },
      })
    ]);

    return { total, page, limit, items };
  }

  /**
   * Returns hackathons where the user is the organizer.
   * Uses both the direct `organizerId` field AND the `UserRole` relation
   * (for edge cases where hackathon was assigned via UserRole but not organizerId).
   */
  async listMyHackathons(userId: string, page: number = 1, limit: number = 50, search?: string) {
    const skip = (page - 1) * limit;

    // Find hackathons where user either:
    // 1. Is the direct organizer (organizerId = userId)
    // 2. Has ORGANIZER UserRole scoped to this hackathon
    const where: any = {
      OR: [
        { organizerId: userId },
        {
          userRoles: {
            some: {
              userId,
              roleName: RoleName.ORGANIZER,
            }
          }
        }
      ]
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      this.prisma.hackathon.count({ where }),
      this.prisma.hackathon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { teams: true } },
          organizer: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
        },
      })
    ]);

    return { total, page, limit, items };
  }

  async updateHackathon(id: string, data: UpdateHackathonBody) {
    await this.getHackathonById(id); // Throws if not found

    return this.prisma.hackathon.update({
      where: { id },
      data,
    });
  }

  async changeStatus(id: string, data: ChangeHackathonStatusBody) {
    const hackathon = await this.getHackathonById(id);

    // Naive state machine validation (can be expanded)
    const currentStatus = hackathon.status;
    const nextStatus = data.status;

    if (currentStatus === nextStatus) {
      return hackathon;
    }

    // Example protection: Can't move from completed back to draft
    if (currentStatus === HackathonStatus.COMPLETED && nextStatus === HackathonStatus.DRAFT) {
      throw new BadRequestError('Cannot move from COMPLETED directly to DRAFT');
    }

    return this.prisma.hackathon.update({
      where: { id },
      data: { status: nextStatus }
    });
  }

  /**
   * Finalizes a hackathon:
   * 1. Must be in JUDGING status
   * 2. All submitted (non-disqualified) projects must have at least one score
   * 3. Sets status = COMPLETED
   * 4. Invalidates leaderboard cache (best-effort)
   */
  async completeHackathon(hackathonId: string, _userId: string) {
    const hackathon = await this.getHackathonById(hackathonId);

    if (hackathon.status !== HackathonStatus.JUDGING) {
      throw new BadRequestError(
        `Hackathon must be in JUDGING status to complete. Current status: ${hackathon.status}`
      );
    }

    // Find all submitted projects from non-disqualified teams
    const submittedProjects = await this.prisma.project.findMany({
      where: {
        team: {
          hackathonId,
          status: { not: 'DISQUALIFIED' },
        },
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED'] },
      },
      include: {
        _count: { select: { scores: true } },
      },
    });

    // Check that every submitted project has at least one score
    const unscoredProjects = submittedProjects.filter(p => p._count.scores === 0);
    if (unscoredProjects.length > 0) {
      throw new BadRequestError(
        `Cannot complete hackathon: ${unscoredProjects.length} project(s) have no scores yet. ` +
        `Please ensure all submitted projects are evaluated before completing.`
      );
    }

    // Set status to COMPLETED
    const completed = await this.prisma.hackathon.update({
      where: { id: hackathonId },
      data: { status: HackathonStatus.COMPLETED },
    });

    return completed;
  }

  // ─── Stages ──────────────────────────────────────────────────────────────────

  async createStage(hackathonId: string, data: CreateStageBody) {
    await this.getHackathonById(hackathonId);
    return this.prisma.stage.create({
      data: { ...data, hackathonId },
    });
  }

  async updateStage(hackathonId: string, stageId: string, data: UpdateStageBody) {
    const stage = await this.prisma.stage.findUnique({ where: { id: stageId } });
    if (!stage || stage.hackathonId !== hackathonId) {
      throw new NotFoundError('Stage not found for this hackathon');
    }
    return this.prisma.stage.update({
      where: { id: stageId },
      data,
    });
  }

  async deleteStage(hackathonId: string, stageId: string) {
    const stage = await this.prisma.stage.findUnique({ where: { id: stageId } });
    if (!stage || stage.hackathonId !== hackathonId) {
      throw new NotFoundError('Stage not found for this hackathon');
    }
    await this.prisma.stage.delete({ where: { id: stageId } });
    return { success: true };
  }

  // ─── Tracks ──────────────────────────────────────────────────────────────────

  async createTrack(hackathonId: string, data: CreateTrackBody) {
    await this.getHackathonById(hackathonId);
    return this.prisma.track.create({
      data: { ...data, hackathonId },
    });
  }

  async updateTrack(hackathonId: string, trackId: string, data: UpdateTrackBody) {
    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track || track.hackathonId !== hackathonId) {
      throw new NotFoundError('Track not found for this hackathon');
    }
    return this.prisma.track.update({
      where: { id: trackId },
      data,
    });
  }

  async deleteTrack(hackathonId: string, trackId: string) {
    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track || track.hackathonId !== hackathonId) {
      throw new NotFoundError('Track not found for this hackathon');
    }
    await this.prisma.track.delete({ where: { id: trackId } });
    return { success: true };
  }

  // ─── Awards ──────────────────────────────────────────────────────────────────

  async createAward(hackathonId: string, data: CreateAwardBody) {
    await this.getHackathonById(hackathonId);
    return this.prisma.award.create({
      data: { ...data, hackathonId },
    });
  }

  async updateAward(hackathonId: string, awardId: string, data: UpdateAwardBody) {
    const award = await this.prisma.award.findUnique({ where: { id: awardId } });
    if (!award || award.hackathonId !== hackathonId) {
      throw new NotFoundError('Award not found for this hackathon');
    }
    return this.prisma.award.update({
      where: { id: awardId },
      data,
    });
  }

  async deleteAward(hackathonId: string, awardId: string) {
    const award = await this.prisma.award.findUnique({ where: { id: awardId } });
    if (!award || award.hackathonId !== hackathonId) {
      throw new NotFoundError('Award not found for this hackathon');
    }
    await this.prisma.award.delete({ where: { id: awardId } });
    return { success: true };
  }

  // ─── Participants & Judges ───────────────────────────────────────────────

  async registerParticipant(hackathonId: string, userId: string) {
    const hackathon = await this.getHackathonById(hackathonId);
    
    // Determine if registration is still open
    if (hackathon.status !== HackathonStatus.REGISTRATION_OPEN) {
      throw new BadRequestError('Registration is not open for this hackathon');
    }
    if (hackathon.registrationDeadline && new Date() > hackathon.registrationDeadline) {
      throw new BadRequestError('Registration deadline has passed');
    }

    // Assign Role (ignores if already Participant due to potential unique constraint logic if implemented, but we just upsert/create)
    const existingRole = await this.prisma.userRole.findUnique({
      where: { userId_roleName_hackathonId: { userId, roleName: RoleName.PARTICIPANT, hackathonId } }
    });

    if (existingRole) {
      throw new BadRequestError('You are already registered as a participant.');
    }

    await this.prisma.userRole.create({
      data: {
        userId,
        hackathonId,
        roleName: RoleName.PARTICIPANT
      }
    });

    return { message: 'Successfully registered for hackathon' };
  }

  async leavePlatform(hackathonId: string, userId: string, teamService: import('./team.service').TeamService) {
    const hackathon = await this.getHackathonById(hackathonId);

    if (hackathon.status !== HackathonStatus.DRAFT && hackathon.status !== HackathonStatus.PUBLISHED && hackathon.status !== HackathonStatus.REGISTRATION_OPEN) {
      throw new BadRequestError('Cannot leave the hackathon after judging/competition has started');
    }

    // Attempt to gracefully remove from team if they are in one
    const membership = await this.prisma.teamMember.findFirst({
      where: { userId, team: { hackathonId } }
    });

    if (membership) {
      await teamService.leaveTeam(membership.teamId, userId);
    }

    // Finally, remove the participant role
    await this.prisma.userRole.delete({
      where: { userId_roleName_hackathonId: { userId, roleName: RoleName.PARTICIPANT, hackathonId } }
    });

    return { success: true };
  }

  async listParticipants(hackathonId: string) {
    const participants = await this.prisma.userRole.findMany({
      where: { hackathonId, roleName: RoleName.PARTICIPANT },
      include: {
        user: { select: { id: true, username: true, fullName: true, avatarUrl: true, skills: true } }
      }
    });

    return participants.map(p => p.user);
  }

  async assignJudge(hackathonId: string, data: { userId: string, trackId?: string }) {
    await this.getHackathonById(hackathonId);

    // 1. Conflict Scan
    // Check if this judge has mentored any team inside this hackathon
    const mentorSlots = await this.prisma.mentorSlot.findMany({
      where: {
        availability: { mentorId: data.userId, hackathonId },
        teamId: { not: null }
      },
      select: { teamId: true }
    });

    const uniqueMentoredTeamIds = [...new Set(mentorSlots.map(s => s.teamId as string))];
    const conflictsCreated: import('@prisma/client').JudgeConflict[] = [];

    // Transaction for assigning judge safely
    await this.prisma.$transaction(async (tx) => {
      // Create JudgeRole generic for the hackathon
      await tx.userRole.upsert({
        where: { userId_roleName_hackathonId: { userId: data.userId, roleName: RoleName.JUDGE, hackathonId } },
        update: {},
        create: { userId: data.userId, roleName: RoleName.JUDGE, hackathonId }
      });

      const existingAssignment = await tx.judgeAssignment.findFirst({
        where: { judgeId: data.userId, hackathonId, trackId: data.trackId ?? null }
      });

      if (!existingAssignment) {
        await tx.judgeAssignment.create({
          data: {
            judgeId: data.userId,
            hackathonId,
            trackId: data.trackId
          }
        });
      }

      // Automatically create conflicts for previously mentored teams
      for (const teamId of uniqueMentoredTeamIds) {
        const existingConf = await tx.judgeConflict.findUnique({
          where: { judgeId_teamId: { judgeId: data.userId, teamId } }
        });
        if (!existingConf) {
          const conf = await tx.judgeConflict.create({
            data: {
              judgeId: data.userId,
              teamId,
              type: 'MENTORED_TEAM',
              reason: 'Automatically detected: Judge mentored this team during the hackathon.'
            }
          });
          conflictsCreated.push(conf);
        }
      }
    });

    if (conflictsCreated.length > 0) {
      return {
        status: 'warning',
        message: 'Judge has mentoring history with one or more teams.',
        conflictsCreated,
        recommendation: 'You can override the conflict manually.'
      };
    }

    return {
      status: 'success',
      message: 'Judge assigned successfully'
    };
  }

  async removeJudge(hackathonId: string, userId: string) {
    // Delete all current judge assignments for this hackathon
    await this.prisma.judgeAssignment.deleteMany({
      where: { hackathonId, judgeId: userId }
    });

    // We can also remove the user role if there are no assignments left
    const remainingAssignments = await this.prisma.judgeAssignment.count({
      where: { hackathonId, judgeId: userId }
    });

    if (remainingAssignments === 0) {
      await this.prisma.userRole.deleteMany({
        where: { userId, hackathonId, roleName: RoleName.JUDGE }
      });
    }

    return { success: true };
  }

  async listJudges(hackathonId: string) {
    // Enrich with judge user info; JudgeAssignment does not have a direct track relation
    // but trackId is stored. Fetch track separately if needed.
    return this.prisma.judgeAssignment.findMany({
      where: { hackathonId },
      include: {
        judge: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
      }
    });
  }
}
