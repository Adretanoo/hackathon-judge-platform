/**
 * @file src/services/team.service.ts
 * @description Core business logic for Team Management.
 */

import { FastifyInstance } from 'fastify';
import { TeamMemberRole, TeamStatus, RoleName } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { 
  BadRequestError, 
  ForbiddenError, 
  NotFoundError, 
  ConflictError 
} from '../utils/errors';
import { buildPaginationMeta } from '../utils/response';
import { 
  CreateTeamBody, 
  UpdateTeamBody, 
  GenerateInviteBody, 
  ListTeamsQuery,
  FreeAgentQuery
} from '../schemas/team.schema';

export class TeamService {
  constructor(private app: FastifyInstance) {}

  /**
   * Create a new team and assign the creator as CAPTAIN.
   * Transactional logic ensures atomic creation.
   */
  async createTeam(hackathonId: string, userId: string, data: CreateTeamBody) {
    // 1. Verify user is registered as participant in this hackathon
    const participantRole = await this.app.prisma.userRole.findFirst({
      where: {
        userId,
        hackathonId,
        roleName: RoleName.PARTICIPANT,
      },
    });

    if (!participantRole) {
      throw new ForbiddenError('Only registered participants can create teams');
    }

    // 2. Ensure user is not already in a team for this hackathon
    const existingMembership = await this.app.prisma.teamMember.findFirst({
      where: {
        userId,
        team: { hackathonId },
      },
    });

    if (existingMembership) {
      throw new ConflictError('You are already a member of a team in this hackathon');
    }

    // 3. Create team and captain membership in a transaction
    return this.app.prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          hackathonId,
          name: data.name,
          description: data.description,
          logoUrl: data.logoUrl,
          trackId: data.trackId,
          status: TeamStatus.FORMING,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId,
          role: TeamMemberRole.CAPTAIN,
        },
      });

      return team;
    });
  }

  async listTeams(hackathonId: string, query: ListTeamsQuery) {
    const { page, limit, trackId, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      hackathonId,
      ...(trackId && { trackId }),
      ...(search && { 
        name: { contains: search, mode: 'insensitive' as const } 
      }),
    };

    const [total, items] = await Promise.all([
      this.app.prisma.team.count({ where }),
      this.app.prisma.team.findMany({
        where,
        skip,
        take: limit,
        include: {
          members: {
            include: {
              user: {
                select: { username: true, fullName: true, avatarUrl: true }
              }
            }
          },
          track: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { 
      items, 
      meta: buildPaginationMeta(total, page, limit) 
    };
  }

  async getTeamById(teamId: string) {
    const team = await this.app.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { username: true, fullName: true, avatarUrl: true }
            }
          }
        },
        track: true,
      },
    });

    if (!team) throw new NotFoundError('Team');
    return team;
  }

  async updateTeam(teamId: string, userId: string, data: UpdateTeamBody) {
    await this.ensureCaptain(teamId, userId);

    return this.app.prisma.team.update({
      where: { id: teamId },
      data,
    });
  }

  async generateInvite(teamId: string, userId: string, data: GenerateInviteBody) {
    await this.ensureCaptain(teamId, userId);

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + data.expiresInMinutes);

    return this.app.prisma.teamInvite.create({
      data: {
        teamId,
        senderId: userId,
        token,
        maxUses: data.maxUses,
        expiresAt,
      },
    });
  }

  async joinByToken(token: string, userId: string) {
    const invite = await this.app.prisma.teamInvite.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invite) throw new NotFoundError('Invite token');
    if (invite.expiresAt < new Date()) throw new BadRequestError('Invite has expired');
    if (invite.usesCount >= invite.maxUses) throw new BadRequestError('Invite usage limit reached');

    // Check if user is already in a team for this hackathon
    const existingMembership = await this.app.prisma.teamMember.findFirst({
      where: {
        userId,
        team: { hackathonId: invite.team.hackathonId },
      },
    });

    if (existingMembership) {
      throw new ConflictError('You are already a member of a team in this hackathon');
    }

    return this.app.prisma.$transaction(async (tx) => {
      // Ensure the user is registered for the hackathon as a participant
      await tx.userRole.upsert({
        where: {
          userId_roleName_hackathonId: {
            userId,
            roleName: RoleName.PARTICIPANT,
            hackathonId: invite.team.hackathonId,
          }
        },
        update: {},
        create: {
          userId,
          roleName: RoleName.PARTICIPANT,
          hackathonId: invite.team.hackathonId,
        }
      });

      const membership = await tx.teamMember.create({
        data: {
          teamId: invite.teamId,
          userId,
          role: TeamMemberRole.MEMBER,
        },
      });

      await tx.teamInvite.update({
        where: { id: invite.id },
        data: { usesCount: { increment: 1 } },
      });

      return { membership, hackathonId: invite.team.hackathonId };
    });
  }

  async removeMember(teamId: string, targetUserId: string, callerId: string) {
    const team = await this.getTeamById(teamId);
    
    // Check if caller is captain or organizer of the hackathon
    const callerRole = await this.app.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: callerId } },
    });

    const isOrganizer = await this.app.prisma.userRole.findFirst({
      where: {
        userId: callerId,
        hackathonId: team.hackathonId,
        roleName: RoleName.ORGANIZER
      }
    });

    if (!isOrganizer && (!callerRole || callerRole.role !== TeamMemberRole.CAPTAIN)) {
      throw new ForbiddenError('Only captains or organizers can remove members');
    }

    // Cannot remove the captain (unless they are the last one, usually handled by team deletion)
    const targetRole = await this.app.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });

    if (targetRole?.role === TeamMemberRole.CAPTAIN) {
      throw new BadRequestError('Cannot remove the team captain');
    }

    return this.app.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });
  }

  async transferCaptaincy(teamId: string, currentCaptainId: string, newCaptainId: string) {
    await this.ensureCaptain(teamId, currentCaptainId);

    const newCaptainRole = await this.app.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: newCaptainId } },
    });

    if (!newCaptainRole) {
      throw new BadRequestError('The target user is not a member of this team');
    }

    return this.app.prisma.$transaction(async (tx) => {
      // Demote current captain
      await tx.teamMember.update({
        where: { teamId_userId: { teamId, userId: currentCaptainId } },
        data: { role: TeamMemberRole.MEMBER },
      });

      // Promote new captain
      const updatedNewCaptain = await tx.teamMember.update({
        where: { teamId_userId: { teamId, userId: newCaptainId } },
        data: { role: TeamMemberRole.CAPTAIN },
      });

      return updatedNewCaptain;
    });
  }

  async leaveTeam(teamId: string, userId: string) {
    const membership = await this.app.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!membership) {
      throw new BadRequestError('You are not a member of this team');
    }

    const teamMembers = await this.app.prisma.teamMember.findMany({
      where: { teamId },
      orderBy: { joinedAt: 'asc' }, // Order by earliest joined
    });

    return this.app.prisma.$transaction(async (tx) => {
      // If user is the last member, delete the entire team
      if (teamMembers.length <= 1) {
        await tx.team.delete({ where: { id: teamId } });
        return { deleted: true };
      }

      // If user is a captain and there are other members, auto-transfer captaincy
      if (membership.role === TeamMemberRole.CAPTAIN) {
        // Find the next eligible captain (the oldest joined member who is not the current captain)
        const nextCaptain = teamMembers.find(m => m.userId !== userId);
        if (nextCaptain) {
          await tx.teamMember.update({
            where: { teamId_userId: { teamId, userId: nextCaptain.userId } },
            data: { role: TeamMemberRole.CAPTAIN },
          });
        }
      }

      // Finally, remove the member
      await tx.teamMember.delete({
        where: { teamId_userId: { teamId, userId } },
      });

      return { deleted: false };
    });
  }

  async getFreeAgents(hackathonId: string, query: FreeAgentQuery) {
    const { page, limit, skills } = query;
    const skip = (page - 1) * limit;

    const where = {
      hackathonId,
      roleName: RoleName.PARTICIPANT,
      user: {
        isLookingForTeam: true,
        ...(skills && {
          skills: {
            array_contains: skills.split(',').map(s => s.trim())
          }
        })
      }
    };

    const [total, roles] = await Promise.all([
      this.app.prisma.userRole.count({ where }),
      this.app.prisma.userRole.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, fullName: true, skills: true, avatarUrl: true, bio: true }
          }
        }
      })
    ]);
 
    return { 
      items: roles.map(r => r.user), 
      meta: buildPaginationMeta(total, page, limit) 
    };
  }

  private async ensureCaptain(teamId: string, userId: string) {
    const membership = await this.app.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!membership || membership.role !== TeamMemberRole.CAPTAIN) {
      // Check if organizer or admin
      const team = await this.app.prisma.team.findUnique({ where: { id: teamId } });
      const roles = await this.app.prisma.userRole.findMany({ where: { userId } });
      const isOrganizer = roles.some(r => r.roleName === RoleName.GLOBAL_ADMIN || (r.roleName === RoleName.ORGANIZER && r.hackathonId === team?.hackathonId));
      
      if (!isOrganizer) {
        throw new ForbiddenError('Action requires team captain privileges');
      }
    }
  }
}
