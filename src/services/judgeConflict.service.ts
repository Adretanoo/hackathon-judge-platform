/**
 * @file src/services/judgeConflict.service.ts
 * @description Thin adapter that exposes JudgeConflict management endpoints.
 *              Core logic lives in JudgeService.
 */

import { PrismaClient } from '@prisma/client';
import { JudgeService } from './judge.service';

export class JudgeConflictService {
  private readonly judgeService: JudgeService;

  constructor(prisma: PrismaClient) {
    this.judgeService = new JudgeService(prisma);
  }

  /**
   * List all conflicts detected in a specific hackathon
   */
  async listConflicts(hackathonId: string) {
    return this.judgeService.getConflicts(hackathonId);
  }

  /**
   * Manually override a conflict so a judge can evaluate a team
   */
  async overrideConflict(conflictId: string, adminId: string, overrideReason: string) {
    return this.judgeService.overrideConflict(conflictId, overrideReason, adminId);
  }
}
