/**
 * @file src/types/index.ts
 * @description Shared TypeScript types, interfaces and enums for the platform.
 */

// ─── User / Auth ─────────────────────────────────────────────────────────────

import { RoleName } from '@prisma/client';

/** Roles available in the system (re-export from Prisma) */
export const UserRole = { ...RoleName };
export type UserRole = RoleName;

/** Status of a user account */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/** Minimal user representation embedded in JWT */
export interface JwtPayload {
  sub: string;       // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/** JWT token pair returned after successful auth */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── Hackathon ────────────────────────────────────────────────────────────────

/** Lifecycle status of a hackathon */
export enum HackathonStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  JUDGING = 'JUDGING',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

// ─── Project ──────────────────────────────────────────────────────────────────

/** Status of a submitted project */
export enum ProjectStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SCORED = 'SCORED',
  DISQUALIFIED = 'DISQUALIFIED',
}

// ─── Generic API responses ────────────────────────────────────────────────────

/**
 * Standard success envelope returned by all API endpoints.
 * @template T - The payload type.
 */
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

/**
 * Standard error envelope returned on failures.
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Pagination metadata for list endpoints */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Generic paginated list */
export interface PaginatedList<T> {
  items: T[];
  meta: PaginationMeta;
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

/** Common query parameters for list endpoints */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
