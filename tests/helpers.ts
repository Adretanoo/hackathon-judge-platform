/**
 * @file tests/helpers.ts
 * @description Shared testing utilities for integration tests.
 */

import type { FastifyInstance } from 'fastify';
import { RoleName } from '@prisma/client';

/**
 * Clears the database tables related to core modules.
 */
export async function clearDatabase(app: FastifyInstance) {
  const prisma = app.prisma;
  
  // Order matters due to foreign key constraints
  await prisma.userToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.projectResource.deleteMany();
  await prisma.project.deleteMany();
  await prisma.award.deleteMany();
  await prisma.track.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.hackathon.deleteMany();
  await prisma.userSocial.deleteMany();
  await prisma.studentInfo.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Helper to get an authentication token for a user.
 */
export async function getAuth(app: FastifyInstance, credentials: { email: string; password: Buffer | string }) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: credentials,
  });

  const body = JSON.parse(response.body);
  if (response.statusCode !== 200) {
    throw new Error(`Auth failed (${response.statusCode}): ${response.body}`);
  }

  const cookies = response.cookies;
  
  return {
    accessToken: body.data.accessToken,
    cookies,
    headers: {
      authorization: `Bearer ${body.data.accessToken}`,
    },
  };
}

/**
 * Creates a test user and assigns a role.
 */
export async function createTestUser(app: FastifyInstance, data: {
  username: string;
  email: string;
  password?: string;
  role?: RoleName;
}) {
  const { username, email, password = 'Password@123!', role = RoleName.PARTICIPANT } = data;
  
  // Register the user
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      username,
      email,
      fullName: `Test ${username}`,
      password,
      role,
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(`Failed to create test user (${response.statusCode}): ${response.body}`);
  }

  const userData = JSON.parse(response.body).data.user;

  // Ensure role is persisted globally if not Participant
  if (role !== RoleName.PARTICIPANT) {
    const existingRole = await app.prisma.userRole.findFirst({
      where: {
        userId: userData.id,
        roleName: role,
        hackathonId: null,
      }
    });

    if (!existingRole) {
      await app.prisma.userRole.create({
        data: {
          userId: userData.id,
          roleName: role,
          hackathonId: null,
        }
      });
    }
  }

  return { id: userData.id, email, password };
}


