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

  async listHackathons(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    // Default public listing only shows non-archived non-draft ones usually, 
    // but for an admin it could be all. We'll return everything for now.
    const filter = {
      status: { notIn: [HackathonStatus.DRAFT, HackathonStatus.ARCHIVED] }
    };

    const [total, items] = await Promise.all([
      this.prisma.hackathon.count({ where: filter }),
      this.prisma.hackathon.findMany({
        where: filter,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
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
}
