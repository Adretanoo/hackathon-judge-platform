/**
 * @file tests/auth.test.ts
 * @description Integration tests for authentication lifecycle.
 */

import { buildApp } from '../src/server';
import type { FastifyInstance } from 'fastify';
import { clearDatabase, getAuth } from './helpers';

describe('Auth Module', () => {
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

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: 'tester',
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.user.username).toBe('tester');
      expect(body.data.accessToken).toBeDefined();
    });

    it('should fail if email is already taken', async () => {
      // Register first user
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: 'user1',
          fullName: 'User One',
          email: 'same@example.com',
          password: 'Password123!',
        },
      });

      // Try to register second user with same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: 'user2',
          fullName: 'User Two',
          email: 'same@example.com',
          password: 'Password123!',
        },
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: 'loginuser',
          fullName: 'Login User',
          email: 'login@example.com',
          password: 'Password123!',
        },
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'login@example.com',
          password: 'Password123!',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.accessToken).toBeDefined();
      
      // Check refresh token cookie
      const refreshTokenCookie = response.cookies.find(c => c.name === 'refreshToken');
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie?.httpOnly).toBe(true);
    });

    it('should fail with incorrect password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'login@example.com',
          password: 'WrongPassword!',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user info when authenticated', async () => {
      const email = 'me@example.com';
      const password = 'Password@123!';
      
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { username: 'meuser', fullName: 'Me User', email, password },
      });

      const { headers } = await getAuth(app, { email, password });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.email).toBe(email);
    });

    it('should fail when no token provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
