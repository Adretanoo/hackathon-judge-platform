/**
 * @file src/services/user.service.ts
 * @description Business logic for User Management (listing, updates, role assignment).
 */

import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import type { ListUsersQuery, UpdateUserAdminBody, AssignRoleBody } from '../schemas/user.schema';

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * List users with pagination and filters (username, email, skills, role).
   */
  async listUsers(params: ListUsersQuery) {
    const { page, limit, search, role, skills, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      AND: [],
    };

    // Global search (username or email)
    if (search) {
      where.AND.push({
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Filter by role
    if (role) {
      where.AND.push({
        roles: {
          some: {
            roleName: role,
          },
        },
      });
    }

    // Filter by skills (JSON array search)
    if (skills) {
      // Assuming skills is a JSON array of strings: ["React", "TypeScript"]
      where.AND.push({
        skills: {
          array_contains: skills,
        },
      });
    }

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: {
          roles: {
            include: {
              hackathon: {
                select: { id: true, title: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      items: items.map((user) => this.formatUser(user)),
    };
  }

  /**
   * Get a single user by ID.
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            hackathon: {
              select: { id: true, title: true },
            },
          },
        },
        studentInfo: true,
        socials: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.formatUser(user);
  }

  /**
   * Update user profile as administrator.
   */
  async updateUser(id: string, data: UpdateUserAdminBody) {
    // Verify existence
    await this.getUserById(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        roles: {
          include: {
            hackathon: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    return this.formatUser(updatedUser);
  }

  /**
   * Delete user account.
   */
  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Assign or update a user's role (global or scoped to a hackathon).
   */
  async assignRole(userId: string, data: AssignRoleBody) {
    const { role: roleName, hackathonId } = data;

    // Verify user exists
    await this.getUserById(userId);

    if (hackathonId) {
      // Hackathon-scoped: skip duplicates
      const existing = await this.prisma.userRole.findFirst({
        where: { userId, roleName: roleName as any, hackathonId },
      });
      if (existing) {
        return { message: 'Role already assigned in this hackathon context' };
      }
      await this.prisma.userRole.create({
        data: { userId, roleName: roleName as any, hackathonId },
      });
    } else {
      // Global role: REPLACE existing global roles so only one global role exists
      await this.prisma.userRole.deleteMany({
        where: { userId, hackathonId: null },
      });
      await this.prisma.userRole.create({
        data: { userId, roleName: roleName as any, hackathonId: null },
      });
    }

    return { success: true, message: `Role ${roleName} assigned successfully` };
  }

  /**
   * Internal helper to format the user object for response.
   */
  private formatUser(user: any) {
    const { passwordHash, ...safeUser } = user;
    const roles = (user as any).roles || [];
    return {
      ...safeUser,
      roles: roles.map((ur: any) => ({
        role: ur.roleName,
        hackathonId: ur.hackathonId ?? undefined,
        hackathonTitle: ur.hackathon?.title,
      })),
    };
  }
}
