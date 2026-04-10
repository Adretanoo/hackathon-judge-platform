import { FastifyRequest, FastifyReply } from 'fastify';
// import { SocketStream } from '@fastify/websocket';
import { LeaderboardService } from '../services/leaderboard.service';
import { successResponse } from '../utils/response';

/** Map to store hackathonId -> Set of WebSocket streams for real-time updates */
const subscriptions = new Map<string, Set<any>>();

export async function getLeaderboardHandler(
  req: FastifyRequest<{ Params: { id: string }; Querystring: { trackId?: string } }>,
  reply: FastifyReply
) {
  const service = new LeaderboardService(req.server);
  const result = await service.getLeaderboard(req.params.id, req.query.trackId);
  return reply.status(200).send(successResponse(result));
}

/**
 * Handle WebSocket connections for real-time leaderboard updates
 */
export function leaderboardWebSocketHandler(connection: any, req: FastifyRequest<{ Params: { id: string } }>) {
  const hackathonId = req.params.id;
  
  appLog(req, `Client connected to leaderboard WS for hackathon: ${hackathonId}`);

  // Track subscription
  if (!subscriptions.has(hackathonId)) {
    subscriptions.set(hackathonId, new Set());
  }
  const set = subscriptions.get(hackathonId)!;
  set.add(connection);

  connection.socket.on('close', () => {
    set.delete(connection);
    if (set.size === 0) {
      subscriptions.delete(hackathonId);
    }
    appLog(req, `Client disconnected from leaderboard WS`);
  });

  // Optionally send initial state
  const service = new LeaderboardService(req.server);
  service.getLeaderboard(hackathonId).then(data => {
    connection.socket.send(JSON.stringify({ type: 'initial', data }));
  }).catch(err => {
    req.log.error(err);
  });
}

/**
 * Broadcast update to all connected clients for a specific hackathon
 */
export async function broadcastLeaderboardUpdate(app: any, hackathonId: string) {
  const set = subscriptions.get(hackathonId);
  if (!set || set.size === 0) return;

  const service = new LeaderboardService(app);
  // Recompute (cache should be invalidated already before this)
  const data = await service.getLeaderboard(hackathonId);
  const message = JSON.stringify({ type: 'update', data });

  for (const conn of set) {
    if (conn.socket.readyState === 1) { // OPEN
      conn.socket.send(message);
    }
  }
}

function appLog(req: any, msg: string) {
  req.log.info(msg);
}
