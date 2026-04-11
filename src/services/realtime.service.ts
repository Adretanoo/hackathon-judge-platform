/**
 * @file src/services/realtime.service.ts
 * @description Centralized Socket.io event emitter wrapper.
 */

import { FastifyInstance } from 'fastify';

export class RealtimeService {
  constructor(private app: FastifyInstance) {}

  /**
   * Leaderboard changed (e.g., someone just submitted a score).
   * Also deletes the Redis cache right away so the next fetch gets fresh data.
   */
  async emitLeaderboardUpdated(hackathonId: string, leaderboardData?: any) {
    if (!this.app.io) return;
    this.app.io.to(`hackathon:${hackathonId}`).emit('leaderboard_updated', leaderboardData);
    await this.app.redis.del(`leaderboard:${hackathonId}`);
  }

  /**
   * New project submitted.
   */
  emitProjectSubmitted(hackathonId: string, project: any) {
    if (!this.app.io) return;
    this.app.io.to(`hackathon:${hackathonId}`).emit('project_submitted', project);
  }

  /**
   * Judge submitted a score.
   */
  emitScoreSubmitted(hackathonId: string, data: { judgeId: string; projectId: string; progress?: number }) {
    if (!this.app.io) return;
    this.app.io.to(`hackathon:${hackathonId}`).emit('score_submitted', data);
  }

  /**
   * Team membership changed.
   */
  emitTeamUpdated(hackathonId: string, teamId: string, team?: any) {
    if (!this.app.io) return;
    this.app.io.to(`hackathon:${hackathonId}`).emit('team_updated', { teamId, team });
  }

  /**
   * New participant joined hackathon entirely.
   */
  emitParticipantJoined(hackathonId: string, user: any) {
    if (!this.app.io) return;
    this.app.io.to(`hackathon:${hackathonId}`).emit('participant_joined', { user });
  }

  /**
   * Push an immediate notification object.
   */
  emitNotification(userId: string, notification: any) {
    if (!this.app.io) return;
    this.app.io.to(`user:${userId}`).emit('notification', notification);
  }
}
