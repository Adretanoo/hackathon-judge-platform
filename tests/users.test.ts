/**
 * @file tests/users.test.ts
 * @description Integration tests for the User Management module (Admin/Organizer).
 */

import { buildApp } from '../src/server';
import type { FastifyInstance } from 'fastify';
import { RoleName } from '@prisma/client';
import { clearDatabase, createTestUser, getAuth } from './helpers';

describe('User Management Module', () => {
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

  describe('GET /api/v1/users', () => {
    it('should allow an admin to list users', async () => {
      // 1. Setup: Create an admin and a normal user
      const adminCreds = await createTestUser(app, {
        username: 'admin_user',
        email: 'admin@test.com',
        role: RoleName.GLOBAL_ADMIN,
      });
      await createTestUser(app, { username: 'user1', email: 'user1@test.com' });

      const { headers } = await getAuth(app, adminCreds);

      // 2. Action
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users',
        headers,
      });

      // 3. Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.total).toBeGreaterThanOrEqual(2);
      expect(body.data.items).toBeDefined();
    });

    it('should search users by skills', async () => {
      const adminCreds = await createTestUser(app, {
        username: 'admin2',
        email: 'admin2@test.com',
        role: RoleName.GLOBAL_ADMIN,
      });
      
      // User with specific skills
      const skillUser = await createTestUser(app, { username: 'skill_guy', email: 'skill@test.com' });
      await app.prisma.user.update({
        where: { id: skillUser.id },
        data: { skills: ['Rust', 'WebAssembly'] }
      });

      const { headers } = await getAuth(app, adminCreds);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users?skills=Rust',
        headers,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.items.some((u: any) => u.username === 'skill_guy')).toBe(true);
    });

    it('should deny access to non-admins', async () => {
      const userCreds = await createTestUser(app, { username: 'regular', email: 'reg@test.com' });
      const { headers } = await getAuth(app, userCreds);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users',
        headers,
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should allow an admin to update a user profile', async () => {
      const adminCreds = await createTestUser(app, {
        username: 'superadmin',
        email: 'super@test.com',
        role: RoleName.GLOBAL_ADMIN,
      });
      const targetUser = await createTestUser(app, { username: 'target', email: 'target@test.com' });

      const { headers } = await getAuth(app, adminCreds);

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/users/${targetUser.id}`,
        headers,
        payload: {
          fullName: 'Updated Name',
          isActive: false,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.fullName).toBe('Updated Name');
      expect(body.data.isActive).toBe(false);
    });
  });

  describe('POST /api/v1/users/:id/roles', () => {
    it('should assign a global role to a user', async () => {
      const adminCreds = await createTestUser(app, {
        username: 'roleadmin',
        email: 'role@test.com',
        role: RoleName.GLOBAL_ADMIN,
      });
      const targetUser = await createTestUser(app, { username: 'lucky', email: 'lucky@test.com' });

      const { headers } = await getAuth(app, adminCreds);

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/users/${targetUser.id}/roles`,
        headers,
        payload: {
          role: RoleName.JUDGE,
        },
      });

      expect(response.statusCode).toBe(200);
      
      // Verify promotion in DB
      const userWithRoles = await app.prisma.user.findUnique({
        where: { id: targetUser.id },
        include: { roles: { include: { role: true } } }
      });
      
      const hasJudgeRole = userWithRoles?.roles.some(ur => ur.role.name === RoleName.JUDGE);
      expect(hasJudgeRole).toBe(true);
    });
  });
});
