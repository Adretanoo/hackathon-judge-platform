import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface LeaderboardEntry {
  projectId: string;
  projectTitle: string;
  teamName: string;
  totalRawScore: number;
  averageRawScore: number;
  normalizedScore: number;
  rank: number;
}

export interface LeaderboardData {
  hackathonId: string;
  trackId?: string;
  lastUpdated: string;
  entries: LeaderboardEntry[];
}

interface UseLeaderboardSocketOptions {
  hackathonId: string;
  onUpdate?: (data: LeaderboardData) => void;
}

export function useLeaderboardSocket({ hackathonId, onUpdate }: UseLeaderboardSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (isUnmountedRef.current || !hackathonId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = import.meta.env.VITE_API_PORT || '3000';
    const url = `${protocol}//${host}:${port}/api/v1/hackathons/${hackathonId}/leaderboard/ws`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[LeaderboardWS] Connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: 'initial' | 'update'; data: LeaderboardData };
        if (msg.type === 'initial' || msg.type === 'update') {
          // Update TanStack Query cache
          queryClient.setQueryData(['leaderboard', hackathonId], msg.data);
          onUpdate?.(msg.data);
        }
      } catch {
        console.warn('[LeaderboardWS] Failed to parse message');
      }
    };

    ws.onclose = () => {
      console.log('[LeaderboardWS] Disconnected — reconnecting in 3s...');
      if (!isUnmountedRef.current) {
        reconnectTimerRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [hackathonId, queryClient, onUpdate]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}
