/**
 * @file tests/health.test.ts
 * @description Integration tests for the /health endpoints.
 */

import { buildApp } from '../src/server';
import type { FastifyInstance } from 'fastify';

describe('Health endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body) as {
        success: boolean;
        data: { status: string; timestamp: string };
      };

      expect(body.success).toBe(true);
      expect(body.data.status).toBe('ok');
      expect(body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /health/ready', () => {
    it('should return a readiness report', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      // May be 200 or 503 depending on env, but must return JSON
      expect([200, 503]).toContain(response.statusCode);

      const body = JSON.parse(response.body) as {
        success: boolean;
        data: { status: string };
      };
      expect(body.success).toBe(true);
      expect(['ok', 'degraded', 'error']).toContain(body.data.status);
    });
  });
});
