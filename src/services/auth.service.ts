/**
 * @file src/services/auth.service.ts
 * @description Authentication service: register, login, token refresh, logout.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import ms from 'ms';
import type { FastifyInstance } from 'fastify';
import { PrismaClient, RoleName } from '@prisma/client';
import { env } from '../config';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import type { JwtPayload, TokenPair } from '../types';
import type { LoginBody, RegisterBody } from '../schemas/auth.schema';

/** Minimal user shape returned to the client */
export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role?: RoleName;
}

/** Response returned after successful auth */
export interface AuthResponse extends TokenPair {
  user: AuthUser;
}

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly app: FastifyInstance,
  ) {}

  async register(body: RegisterBody, ipAddress?: string, deviceInfo?: string): Promise<AuthResponse> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: body.email }, { username: body.username }],
      },
    });

    if (existing) {
      throw new ConflictError('An account with this email or username already exists');
    }

    const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS);

    const userRole = body.role || RoleName.PARTICIPANT;

    const user = await this.prisma.user.create({
      data: {
        username: body.username,
        fullName: body.fullName,
        email: body.email,
        passwordHash,
      },
      select: { id: true, username: true, fullName: true, email: true },
    });

    // Optionally assign global role directly if we have seed roles, but skipping for brevity
    // unless strictly needed. We will return it mockingly in authUser payload.
    
    const tokens = await this.generateAndStoreTokens(user.id, user.email, userRole, ipAddress, deviceInfo);

    return { ...tokens, user: { ...user, role: userRole } };
  }

  async login(body: LoginBody, ipAddress?: string, deviceInfo?: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
      include: {
        roles: true
      }
    });

    if (!user || user.isActive === false) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // ── 2FA Stub ──
    const is2faEnabled = false; // Add this block logic later when enabling 2FA
    if (is2faEnabled) {
      // return type could be extended to indicate OTP needed
      // return { requires2fa: true };
    }

    const ROLE_RANK: Record<string, number> = { GLOBAL_ADMIN: 50, ORGANIZER: 40, JUDGE: 30, MENTOR: 20, PARTICIPANT: 10 };
    let primaryRole: RoleName = RoleName.PARTICIPANT;
    for (const r of user.roles) {
      if ((ROLE_RANK[r.roleName] || 0) > ROLE_RANK[primaryRole]) {
        primaryRole = r.roleName as RoleName;
      }
    }

    const tokens = await this.generateAndStoreTokens(user.id, user.email, primaryRole, ipAddress, deviceInfo);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: primaryRole,
      },
    };
  }

  async refresh(refreshToken: string, ipAddress?: string, deviceInfo?: string): Promise<TokenPair> {
    try {
      this.app.jwt.verify<JwtPayload>(refreshToken, {
        key: env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.userToken.findUnique({
      where: { tokenHash },
      include: { user: {
        include: {
          roles: true
        }
      }}
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      // Possible token reuse attack detected, or normal expiration
      throw new UnauthorizedError('Invalid or revoked refresh token');
    }

    const user = storedToken.user;
    if (!user.isActive) {
      throw new UnauthorizedError('User is not active');
    }

    // Revoke the old token (Token rotation mechanism)
    await this.prisma.userToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() }
    });

    const ROLE_RANK: Record<string, number> = { GLOBAL_ADMIN: 50, ORGANIZER: 40, JUDGE: 30, MENTOR: 20, PARTICIPANT: 10 };
    let primaryRole: RoleName = RoleName.PARTICIPANT;
    for (const r of user.roles) {
      if ((ROLE_RANK[r.roleName] || 0) > ROLE_RANK[primaryRole]) {
        primaryRole = r.roleName as RoleName;
      }
    }

    return await this.generateAndStoreTokens(user.id, user.email, primaryRole, ipAddress, deviceInfo);
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.userToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async generateAndStoreTokens(userId: string, email: string, role: RoleName, ipAddress?: string, deviceInfo?: string): Promise<TokenPair> {
    const jti = crypto.randomUUID();
    const payload: JwtPayload = { sub: userId, email, role: role as any, jti };

    const accessToken = this.app.jwt.sign(payload, { expiresIn: env.JWT_EXPIRES_IN });
    const refreshToken = this.app.jwt.sign(payload, { key: env.JWT_REFRESH_SECRET, expiresIn: env.JWT_REFRESH_EXPIRES_IN });


    const tokenHash = this.hashToken(refreshToken);
    const expiresMs = ms(env.JWT_REFRESH_EXPIRES_IN as string);
    const expiresAt = new Date(Date.now() + expiresMs);

    await this.prisma.userToken.create({
      data: {
        userId,
        tokenHash,
        ipAddress,
        deviceInfo,
        expiresAt,
      }
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
