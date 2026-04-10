/**
 * @file src/services/auth.service.ts
 * @description Authentication service: register, login, token refresh, logout.
 */

import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { env } from '../config';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import type { JwtPayload, TokenPair, UserRole } from '../types';
import type { LoginBody, RegisterBody } from '../schemas/auth.schema';

/** Minimal user shape returned to the client */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Response returned after successful auth */
export interface AuthResponse extends TokenPair {
  user: AuthUser;
}

/**
 * Authentication service class.
 * Depends on Prisma for persistence and Fastify for JWT signing.
 */
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly app: FastifyInstance,
  ) {}

  /**
   * Registers a new user account.
   *
   * @param body - Validated registration payload.
   * @returns    Auth response with token pair and user info.
   * @throws ConflictError if the email is already taken.
   */
  async register(body: RegisterBody): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const tokens = this.signTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return { ...tokens, user: user as AuthUser };
  }

  /**
   * Authenticates a user with email + password.
   *
   * @param body - Validated login payload.
   * @returns    Auth response with token pair and user info.
   * @throws UnauthorizedError on invalid credentials.
   */
  async login(body: LoginBody): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || user.status === 'BANNED') {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.signTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
      },
    };
  }

  /**
   * Generates a new access token from a valid refresh token.
   *
   * @param refreshToken - JWT refresh token string.
   * @returns New token pair.
   * @throws UnauthorizedError if the refresh token is invalid.
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;

    try {
      payload = this.app.jwt.verify<JwtPayload>(refreshToken, {
        key: env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.status === 'BANNED') {
      throw new UnauthorizedError('User not found or banned');
    }

    return this.signTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Signs both an access token and a refresh token.
   *
   * @param payload - JWT claims.
   * @returns TokenPair { accessToken, refreshToken }.
   */
  private signTokenPair(payload: JwtPayload): TokenPair {
    const accessToken = this.app.jwt.sign(payload, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const refreshToken = this.app.jwt.sign(payload, {
      key: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }
}
