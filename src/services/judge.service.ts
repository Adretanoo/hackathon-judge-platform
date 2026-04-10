/**
 * @file src/services/judge.service.ts
 * @description Business logic for Judge Assignment management, conflict detection,
 *              and conflict overriding — with atomic Prisma transactions.
 */

import { PrismaClient, RoleName, ConflictType } from '@prisma/client';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssignJudgeOptions {
  hackathonId: string;
  userId: string;
  trackId?: string;
  /** If true, judges with detected conflicts are still assigned but conflicts are
   *  recorded. If false (default) the assignment is blocked when conflicts exist. */
  allowConflictOverride?: boolean;
}

export interface ConflictedTeam {
  teamId: string;
  teamName: string;
  /** Number of mentoring sessions the judge had with this team */
  sessionCount: number;
}

export interface AssignJudgeResult {
  status: 'success' | 'warning';
  message: string;
  assignment: {
    id: string;
    judgeId: string;
    hackathonId: string;
    trackId: string | null;
  };
  conflictsCreated: import('@prisma/client').JudgeConflict[];
  recommendation?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class JudgeService {
  constructor(private readonly prisma: PrismaClient) {}

  // ---------------------------------------------------------------------------
  // checkMentoringConflict
  // ---------------------------------------------------------------------------

  /**
   * Returns every team inside a hackathon that the given judge has mentored
   * (i.e. had at least one BOOKED or COMPLETED MentorSlot with a team).
   */
  async checkMentoringConflict(
    judgeId: string,
    hackathonId: string,
  ): Promise<ConflictedTeam[]> {
    // Find all MentorSlots where:
    //   - the MentorAvailability belongs to this judge + hackathon
    //   - a team was booked (teamId is set)
    const slots = await this.prisma.mentorSlot.findMany({
      where: {
        availability: { mentorId: judgeId, hackathonId },
        teamId: { not: null },
      },
      select: {
        teamId: true,
      },
    });

    if (slots.length === 0) return [];

    // Aggregate: count sessions per team
    const countByTeam = new Map<string, number>();
    for (const s of slots) {
      const tid = s.teamId as string;
      countByTeam.set(tid, (countByTeam.get(tid) ?? 0) + 1);
    }

    // Fetch team names for a richer response
    const teams = await this.prisma.team.findMany({
      where: { id: { in: [...countByTeam.keys()] } },
      select: { id: true, name: true },
    });

    return teams.map((t) => ({
      teamId: t.id,
      teamName: t.name,
      sessionCount: countByTeam.get(t.id) ?? 0,
    }));
  }

  // ---------------------------------------------------------------------------
  // assignJudge
  // ---------------------------------------------------------------------------

  /**
   * Assigns a judge to a hackathon (and optionally a track).
   *
   * Flow:
   *  1. Verify hackathon exists.
   *  2. Verify user exists (throw 404 otherwise).
   *  3. Run conflict scan via checkMentoringConflict().
   *  4. Inside a single Prisma transaction:
   *     a. Upsert JUDGE UserRole for the hackathon.
   *     b. Create or skip the JudgeAssignment.
   *     c. Auto-create JudgeConflict rows for every conflicted team (MENTORED_TEAM).
   *  5. Return structured result with status='warning' if conflicts were found,
   *     or status='success' if clean.
   *
   * If allowConflictOverride=false (default) AND conflicts exist, this method
   * throws a ForbiddenError rather than proceeding.
   */
  async assignJudge(opts: AssignJudgeOptions): Promise<AssignJudgeResult> {
    const { hackathonId, userId, trackId, allowConflictOverride = false } = opts;

    // 1. Validate hackathon and user
    const [hackathon, user] = await Promise.all([
      this.prisma.hackathon.findUnique({ where: { id: hackathonId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!hackathon) throw new NotFoundError('Hackathon not found');
    if (!user) throw new NotFoundError('User not found');

    // Validate trackId if provided
    if (trackId) {
      const track = await this.prisma.track.findFirst({
        where: { id: trackId, hackathonId },
      });
      if (!track) throw new NotFoundError('Track not found in this hackathon');
    }

    // 2. Conflict scan (outside transaction — read-only, idempotent)
    const conflictedTeams = await this.checkMentoringConflict(userId, hackathonId);
    const hasConflicts = conflictedTeams.length > 0;

    // 3. Block if conflicts exist and override is not permitted
    if (hasConflicts && !allowConflictOverride) {
      throw new ForbiddenError(
        `Judge has mentoring history with ${conflictedTeams.length} team(s) in this hackathon. ` +
          'Pass allowConflictOverride=true to assign anyway.',
      );
    }

    // 4. Atomic transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 4a. Upsert JUDGE role for this hackathon
      await tx.userRole.upsert({
        where: {
          userId_roleName_hackathonId: {
            userId,
            roleName: RoleName.JUDGE,
            hackathonId,
          },
        },
        update: {},
        create: { userId, roleName: RoleName.JUDGE, hackathonId },
      });

      // 4b. Create JudgeAssignment (skip if already exists for same hackathon+track)
      const existing = await tx.judgeAssignment.findFirst({
        where: { judgeId: userId, hackathonId, trackId: trackId ?? null },
      });

      let assignment = existing;
      if (!assignment) {
        assignment = await tx.judgeAssignment.create({
          data: { judgeId: userId, hackathonId, trackId },
        });
      }

      // 4c. Auto-create JudgeConflict records for each previously-mentored team
      const newConflicts: import('@prisma/client').JudgeConflict[] = [];

      if (hasConflicts) {
        for (const { teamId, teamName, sessionCount } of conflictedTeams) {
          // Upsert — do not duplicate if already recorded
          const existing = await tx.judgeConflict.findUnique({
            where: { judgeId_teamId: { judgeId: userId, teamId } },
          });

          if (!existing) {
            const conflict = await tx.judgeConflict.create({
              data: {
                judgeId: userId,
                teamId,
                type: ConflictType.MENTORED_TEAM,
                reason:
                  `Automatically detected: judge conducted ${sessionCount} mentoring ` +
                  `session(s) with team "${teamName}" during this hackathon.`,
              },
            });
            newConflicts.push(conflict);
          }
        }
      }

      return { assignment, newConflicts };
    });

    // 5. Build response
    if (hasConflicts) {
      return {
        status: 'warning',
        message: `Judge assigned with ${result.newConflicts.length} new conflict(s) recorded.`,
        assignment: {
          id: result.assignment!.id,
          judgeId: result.assignment!.judgeId,
          hackathonId: result.assignment!.hackathonId,
          trackId: result.assignment!.trackId,
        },
        conflictsCreated: result.newConflicts,
        recommendation:
          'Review each conflict at GET /hackathons/:id/conflicts and override if acceptable.',
      };
    }

    return {
      status: 'success',
      message: 'Judge assigned successfully with no conflicts.',
      assignment: {
        id: result.assignment!.id,
        judgeId: result.assignment!.judgeId,
        hackathonId: result.assignment!.hackathonId,
        trackId: result.assignment!.trackId,
      },
      conflictsCreated: [],
    };
  }

  // ---------------------------------------------------------------------------
  // getConflicts
  // ---------------------------------------------------------------------------

  /**
   * Returns all JudgeConflicts for teams that belong to the given hackathon.
   * Includes judge and team info for easy display.
   */
  async getConflicts(hackathonId: string) {
    // Verify hackathon exists
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundError('Hackathon not found');

    return this.prisma.judgeConflict.findMany({
      where: { team: { hackathonId } },
      include: {
        judge: {
          select: { id: true, username: true, fullName: true, avatarUrl: true },
        },
        team: { select: { id: true, name: true, trackId: true } },
      },
      orderBy: { detectedAt: 'desc' },
    });
  }

  // ---------------------------------------------------------------------------
  // overrideConflict
  // ---------------------------------------------------------------------------

  /**
   * Marks a JudgeConflict as overridden so the judge may proceed to score the team.
   * Records who approved the override and their reason.
   */
  async overrideConflict(
    conflictId: string,
    overrideReason: string,
    adminId: string,
  ) {
    const conflict = await this.prisma.judgeConflict.findUnique({
      where: { id: conflictId },
      include: { team: true },
    });

    if (!conflict) throw new NotFoundError('Conflict not found');
    if (conflict.overridden) {
      throw new BadRequestError('Conflict has already been overridden');
    }
    if (!overrideReason?.trim()) {
      throw new BadRequestError('overrideReason is required');
    }

    return this.prisma.judgeConflict.update({
      where: { id: conflictId },
      data: {
        overridden: true,
        overriddenBy: adminId,
        overrideReason: overrideReason.trim(),
      },
      include: {
        judge: { select: { id: true, username: true, fullName: true } },
        team: { select: { id: true, name: true } },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // removeJudge
  // ---------------------------------------------------------------------------

  /**
   * Removes all JudgeAssignment rows for this judge+hackathon pair and revokes
   * the JUDGE UserRole if no assignments remain.
   */
  async removeJudge(hackathonId: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundError('Hackathon not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.judgeAssignment.deleteMany({
        where: { hackathonId, judgeId: userId },
      });

      // Revoke JUDGE role for this hackathon if no assignments remain
      const remaining = await tx.judgeAssignment.count({
        where: { hackathonId, judgeId: userId },
      });

      if (remaining === 0) {
        await tx.userRole.deleteMany({
          where: { userId, hackathonId, roleName: RoleName.JUDGE },
        });
      }

      return { success: true };
    });
  }

  // ---------------------------------------------------------------------------
  // listJudges
  // ---------------------------------------------------------------------------

  /**
   * Returns all JudgeAssignment entries for the given hackathon, enriched with
   * basic judge profile info and their active (non-overridden) conflict count.
   */
  async listJudges(hackathonId: string) {
    const assignments = await this.prisma.judgeAssignment.findMany({
      where: { hackathonId },
      include: {
        judge: {
          select: { id: true, username: true, fullName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Annotate each assignment with active conflict count
    const augmented = await Promise.all(
      assignments.map(async (a) => {
        const activeConflicts = await this.prisma.judgeConflict.count({
          where: {
            judgeId: a.judgeId,
            overridden: false,
            team: { hackathonId },
          },
        });

        return { ...a, activeConflicts };
      }),
    );

    return augmented;
  }
}
