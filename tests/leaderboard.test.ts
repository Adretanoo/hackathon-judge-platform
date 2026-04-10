import { buildApp } from '../src/server';
import type { FastifyInstance } from 'fastify';
import { RoleName } from '@prisma/client';
import { clearDatabase, createTestUser, getAuth } from './helpers';

// Mock ioredis
jest.mock('ioredis', () => {
  const Redis = require('ioredis-mock');
  return Redis;
});

describe('Leaderboard Module', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase(app);
  });

  it('should compute the leaderboard and respect tracks', async () => {
    // 1. Setup Data
    const org = await createTestUser(app, { username: 'lb_org', email: 'lb_org@test.com', role: RoleName.ORGANIZER });
    const orgHeaders = (await getAuth(app, org)).headers;

    const hackRes = await app.inject({
      method: 'POST', url: '/api/v1/hackathons', headers: orgHeaders,
      payload: { title: 'Leaderboard Hackathon', startDate: new Date().toISOString(), endDate: new Date().toISOString() }
    });
    const hackathonId = JSON.parse(hackRes.body).data.id;

    const track1Res = await app.inject({
      method: 'POST', url: `/api/v1/hackathons/${hackathonId}/tracks`, headers: orgHeaders,
      payload: { name: 'Track 1', description: 'desc' }
    });
    const track1Id = JSON.parse(track1Res.body).data.id;

    const track2Res = await app.inject({
      method: 'POST', url: `/api/v1/hackathons/${hackathonId}/tracks`, headers: orgHeaders,
      payload: { name: 'Track 2', description: 'desc' }
    });
    const track2Id = JSON.parse(track2Res.body).data.id;

    const criteriaRes = await app.inject({
      method: 'POST', url: `/api/v1/hackathons/${hackathonId}/criteria`, headers: orgHeaders,
      payload: { trackId: track1Id, name: 'Main Spec', weight: 1.0, maxScore: 10 }
    });
    const criteriaId = JSON.parse(criteriaRes.body).data.id;

    // Create 2 Teams in Track 1
    const team1Id = (await app.prisma.team.create({ data: { name: 'Team 1', hackathonId, trackId: track1Id }})).id;
    const team2Id = (await app.prisma.team.create({ data: { name: 'Team 2', hackathonId, trackId: track1Id }})).id;
    
    const proj1Id = (await app.prisma.project.create({ data: { teamId: team1Id, title: 'Project 1', status: 'SUBMITTED' }})).id;
    const proj2Id = (await app.prisma.project.create({ data: { teamId: team2Id, title: 'Project 2', status: 'SUBMITTED' }})).id;

    const judge = await createTestUser(app, { username: 'lb_judge', email: 'lb_judge@test.com', role: RoleName.JUDGE });
    const judgeHeaders = (await getAuth(app, judge)).headers;

    // Judge gives scores (Project 1 better than Project 2)
    await app.inject({
      method: 'POST', url: `/api/v1/projects/${proj1Id}/scores`, headers: judgeHeaders,
      payload: { scores: [{ criteriaId, scoreValue: 10 }] }
    });
    await app.inject({
      method: 'POST', url: `/api/v1/projects/${proj2Id}/scores`, headers: judgeHeaders,
      payload: { scores: [{ criteriaId, scoreValue: 5 }] }
    });

    // 2. Fetch Leaderboard
    const lbRes = await app.inject({
      method: 'GET', url: `/api/v1/hackathons/${hackathonId}/leaderboard`,
    });

    expect(lbRes.statusCode).toBe(200);
    const data = JSON.parse(lbRes.body).data;
    expect(data.entries.length).toBe(2);
    expect(data.entries[0].projectTitle).toBe('Project 1');
    expect(data.entries[0].rank).toBe(1);
    expect(data.entries[1].projectTitle).toBe('Project 2');

    // 3. Test Redis Cache (second hit should be from cache)
    // We can check if it returns same data very fast or check trace logs if we had them.
    // For now, just ensure it doesn't break.
    const lbCacheRes = await app.inject({
      method: 'GET', url: `/api/v1/hackathons/${hackathonId}/leaderboard`,
    });
    expect(lbCacheRes.statusCode).toBe(200);
    expect(JSON.parse(lbCacheRes.body).data.entries[0].projectTitle).toBe('Project 1');

    // 4. Track Specific Leaderboard
    const trackLbRes = await app.inject({
      method: 'GET', url: `/api/v1/hackathons/${hackathonId}/leaderboard?trackId=${track1Id}`,
    });
    expect(JSON.parse(trackLbRes.body).data.entries.length).toBe(2);

    const emptyTrackLbRes = await app.inject({
      method: 'GET', url: `/api/v1/hackathons/${hackathonId}/leaderboard?trackId=${track2Id}`,
    });
    expect(JSON.parse(emptyTrackLbRes.body).data.entries.length).toBe(0);
  });
});
