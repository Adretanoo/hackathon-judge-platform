/**
 * @file tests/hackathons.test.ts
 * @description Integration tests for the Hackathon module.
 */

import { buildApp } from '../src/server';
import type { FastifyInstance } from 'fastify';
import { RoleName, HackathonStatus } from '@prisma/client';
import { clearDatabase, createTestUser, getAuth } from './helpers';

describe('Hackathon Module', () => {
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

  describe('CRUD Lifecycle', () => {
    it('should create, update and publish a hackathon', async () => {
      // 1. Setup Organizer
      const orgCreds = await createTestUser(app, {
        username: 'organizer1',
        email: 'org1@test.com',
        role: RoleName.ORGANIZER,
      });
      const { headers } = await getAuth(app, orgCreds);

      // 2. Create Hackathon
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/hackathons',
        headers,
        payload: {
          title: 'Initial Hackathon',
          description: 'A test event',
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 172800000).toISOString(),
        },
      });

      expect(createResponse.statusCode).toBe(201);
      const hackathonId = JSON.parse(createResponse.body).data.id;

      // 3. Update Hackathon
      const updateResponse = await app.inject({
        method: 'PUT',
        url: `/api/v1/hackathons/${hackathonId}`,
        headers,
        payload: { title: 'Updated Title' },
      });
      expect(updateResponse.statusCode).toBe(200);
      expect(JSON.parse(updateResponse.body).data.title).toBe('Updated Title');

      // 4. Change Status to PUBLISHED
      const statusResponse = await app.inject({
        method: 'PATCH',
        url: `/api/v1/hackathons/${hackathonId}/status`,
        headers,
        payload: { status: HackathonStatus.PUBLISHED },
      });
      expect(statusResponse.statusCode).toBe(200);
      expect(JSON.parse(statusResponse.body).data.status).toBe(HackathonStatus.PUBLISHED);
    });

    it('should prevent non-organizers from creating hackathons', async () => {
      const userCreds = await createTestUser(app, { username: 'participant', email: 'part@test.com' });
      const { headers } = await getAuth(app, userCreds);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/hackathons',
        headers,
        payload: {
          title: 'Hackathon',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('Stages & Tracks', () => {
    let hackathonId: string;
    let authHeaders: any;

    beforeEach(async () => {
      const orgCreds = await createTestUser(app, {
        username: 'org_sub',
        email: 'org_sub@test.com',
        role: RoleName.ORGANIZER,
      });
      const { headers } = await getAuth(app, orgCreds);
      authHeaders = headers;

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/hackathons',
        headers: authHeaders,
        payload: {
          title: 'Sub-entities Hackathon',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
      });
      hackathonId = JSON.parse(createResponse.body).data.id;
    });

    it('should allow adding a stage', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/hackathons/${hackathonId}/stages`,
        headers: authHeaders,
        payload: {
          name: 'Submission Stage',
          orderIndex: 1,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body).data;
      expect(data.name).toBe('Submission Stage');
    });

    it('should allow adding a track', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/hackathons/${hackathonId}/tracks`,
        headers: authHeaders,
        payload: {
          name: 'AI Track',
          description: 'Artificial Intelligence and ML',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body).data;
      expect(data.name).toBe('AI Track');
    });
  });
});
