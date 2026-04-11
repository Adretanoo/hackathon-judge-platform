/**
 * @file web/src/shared/hooks/useHackathonSocket.ts
 * @description Listens to real-time events for a specific hackathon and invalidates React Query cache automatically.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/app/providers/socket-provider';
import { toast } from 'sonner';

export function useHackathonSocket(hackathonId: string) {
  const socket = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !hackathonId) return;

    // Join hackathon room
    socket.emit('join:hackathon', hackathonId);

    // Leaderboard updated (e.g. someone submitted a score)
    const onLeaderboardUpdated = () => {
      qc.invalidateQueries({ queryKey: ['leaderboard', hackathonId] });
      // We could optionally show a toast here if we want to be noisy
    };

    // A team just submitted their project
    const onProjectSubmitted = (project: { title: string }) => {
      qc.invalidateQueries({ queryKey: ['projects', hackathonId] });
      qc.invalidateQueries({ queryKey: ['judging', 'queue'] }); // refresh judge queue just in case
      toast.info(`📦 Нова подача проєкту: ${project.title}`, { duration: 4000 });
    };

    // Someone's score was recorded
    const onScoreSubmitted = () => {
      // Invalidate the judge's own queue or overall progress if needed
      qc.invalidateQueries({ queryKey: ['judging', 'dashboard'] });
    };

    // Team membership changed (someone joined, left, transferred captaincy)
    const onTeamUpdated = () => {
      // Refresh participant status (which includes team data)
      qc.invalidateQueries({ queryKey: ['participant', 'status', hackathonId] });
      qc.invalidateQueries({ queryKey: ['team', 'my'] });
    };

    // New person joined the hackathon
    const onParticipantJoined = () => {
      qc.invalidateQueries({ queryKey: ['participants', hackathonId] });
      qc.invalidateQueries({ queryKey: ['hackathon', hackathonId, 'stats'] });
    };

    socket.on('leaderboard_updated', onLeaderboardUpdated);
    socket.on('project_submitted', onProjectSubmitted);
    socket.on('score_submitted', onScoreSubmitted);
    socket.on('team_updated', onTeamUpdated);
    socket.on('participant_joined', onParticipantJoined);

    return () => {
      socket.emit('leave:hackathon', hackathonId);
      socket.off('leaderboard_updated', onLeaderboardUpdated);
      socket.off('project_submitted', onProjectSubmitted);
      socket.off('score_submitted', onScoreSubmitted);
      socket.off('team_updated', onTeamUpdated);
      socket.off('participant_joined', onParticipantJoined);
    };
  }, [socket, hackathonId, qc]);
}
