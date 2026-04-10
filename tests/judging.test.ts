import { buildApp } from '../src/server';
import type { FastifyInstance } from 'fastify';
import { RoleName, ProjectStatus } from '@prisma/client';
import { clearDatabase, createTestUser, getAuth } from './helpers';

describe('Judging Workflow Modules', () => {
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

  describe('End to end: Hackathon -> Project -> Scores', () => {
    let orgHeaders: any;
    let participantHeaders: any;
    let judgeHeaders: any;

    let hackathonId: string;
    let trackId: string;
    let criteriaIds: string[] = [];
    let teamId: string;
    let projectId: string;
    let participantId: string;

    it('should complete the entire workflow', async () => {
      // 1. Setup Organizer
      const orgCreds = await createTestUser(app, {
        username: 'org2', email: 'org2@test.com', role: RoleName.ORGANIZER
      });
      orgHeaders = (await getAuth(app, orgCreds)).headers;

      // 2. Setup Participant (Team Captain)
      const partCreds = await createTestUser(app, {
        username: 'part2', email: 'part2@test.com', role: RoleName.PARTICIPANT
      });
      participantId = partCreds.id;
      participantHeaders = (await getAuth(app, partCreds)).headers;

      // 3. Setup Judge
      const judgeCreds = await createTestUser(app, {
        username: 'judge2', email: 'judge2@test.com', role: RoleName.JUDGE
      });
      judgeHeaders = (await getAuth(app, judgeCreds)).headers;

      // 4. Create Hackathon & Track
      const hackRes = await app.inject({
        method: 'POST', url: '/api/v1/hackathons', headers: orgHeaders,
        payload: { title: 'Judging Hackathon', startDate: new Date().toISOString(), endDate: new Date().toISOString() }
      });
      hackathonId = JSON.parse(hackRes.body).data.id;

      const trackRes = await app.inject({
        method: 'POST', url: `/api/v1/hackathons/${hackathonId}/tracks`, headers: orgHeaders,
        payload: { name: 'Main Track', description: 'desc' }
      });
      trackId = JSON.parse(trackRes.body).data.id;

      // 5. Create Criteria for Track
      const crit1Res = await app.inject({
        method: 'POST', url: `/api/v1/hackathons/${hackathonId}/criteria`, headers: orgHeaders,
        payload: { trackId, name: 'Innovation', weight: 2.0, maxScore: 10 }
      });
      criteriaIds.push(JSON.parse(crit1Res.body).data.id);

      const crit2Res = await app.inject({
        method: 'POST', url: `/api/v1/hackathons/${hackathonId}/criteria`, headers: orgHeaders,
        payload: { trackId, name: 'Technical', weight: 1.0, maxScore: 10 }
      });
      criteriaIds.push(JSON.parse(crit2Res.body).data.id);

      // 6. Setup Team manually via Prisma (since there is no Team router provided in previous modules yet)
      const team = await app.prisma.team.create({
        data: {
          hackathonId,
          trackId,
          name: 'Awesome Team',
          members: {
            create: { userId: participantId, role: 'CAPTAIN' }
          }
        }
      });
      teamId = team.id;

      // 7. Participant Creates Project
      const projRes = await app.inject({
        method: 'POST', url: '/api/v1/projects', headers: participantHeaders,
        payload: { teamId, title: 'Super App', repoUrl: 'https://github.com/test' }
      });
      expect(projRes.statusCode).toBe(201);
      projectId = JSON.parse(projRes.body).data.id;

      // 8. Participant Submits Project
      const submitRes = await app.inject({
        method: 'PATCH', url: `/api/v1/projects/${projectId}/status`, headers: participantHeaders,
        payload: { status: ProjectStatus.SUBMITTED }
      });
      expect(submitRes.statusCode).toBe(200);

      // 9. Judge Fetches Project Criteria
      const getCritRes = await app.inject({
        method: 'GET', url: `/api/v1/projects/${projectId}/criteria`, headers: judgeHeaders,
      });
      console.log('GET /criteria BODY:', getCritRes.body);
      expect(getCritRes.statusCode).toBe(200);
      expect(JSON.parse(getCritRes.body).data.length).toBe(2);

      // 10. Judge Submits Scores
      const scoreRes = await app.inject({
        method: 'POST', url: `/api/v1/projects/${projectId}/scores`, headers: judgeHeaders,
        payload: {
          scores: [
            { criteriaId: criteriaIds[0], scoreValue: 8 },
            { criteriaId: criteriaIds[1], scoreValue: 9 }
          ]
        }
      });
      expect(scoreRes.statusCode).toBe(200);
      const scoreData = JSON.parse(scoreRes.body).data;
      expect(scoreData.projectStatus).toBe('UNDER_REVIEW');
      
      // Auto-calculated score: (8 * 2.0) + (9 * 1.0) = 16 + 9 = 25
      // average_score depends on implementation. I implemented it as raw divided by 1 judge.
      expect(Number(scoreData.averageScore)).toBe(25);

      // 11. Fetch Normalized Scores
      const fetchScoresRes = await app.inject({
        method: 'GET', url: `/api/v1/projects/${projectId}/scores`, headers: orgHeaders,
      });
      expect(fetchScoresRes.statusCode).toBe(200);
      const fetchedScores = JSON.parse(fetchScoresRes.body).data.scores;
      expect(fetchedScores.length).toBe(2);
      expect(fetchedScores[0].zScore).toBeDefined();
      // 12. Check reject score submission if judge is in conflicts
      // Assume judge3 is judging a team they are conflicted with
      const judCreds = await createTestUser(app, { username: 'judg3', email: 'j3@t.com', role: RoleName.JUDGE });
      const judHdrs = (await getAuth(app, judCreds)).headers;
      
      const conflictTeam = await app.prisma.team.create({ data: { name: 'Conflict Team', hackathonId, trackId }});
      const proj = await app.prisma.project.create({ data: { teamId: conflictTeam.id, title: 'Conflicted', status: 'SUBMITTED' }});
      
      await app.prisma.judgeConflict.create({
        data: { judgeId: judCreds.id, teamId: conflictTeam.id, type: 'SUPERVISOR' }
      });

      const conflictScoreRes = await app.inject({
        method: 'POST', url: `/api/v1/projects/${proj.id}/scores`, headers: judHdrs,
        payload: { scores: [{ criteriaId: 'dummy', scoreValue: 10 }] }
      });

      expect(conflictScoreRes.statusCode).toBe(403);
      expect(JSON.parse(conflictScoreRes.body).error.message).toMatch(/conflict of interest/i);
    });
  });
});
