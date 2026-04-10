/**
 * @file src/utils/response.ts
 * @description Helper functions for building standardised API response envelopes.
 */

import type { PaginationMeta, ApiSuccess, ApiError } from '../types';

/**
 * Wraps data into a success envelope.
 *
 * @param data    - The payload to return.
 * @param meta    - Optional pagination metadata.
 * @returns       Standard success response object.
 */
export function successResponse<T>(
  data: T,
  meta?: PaginationMeta,
): ApiSuccess<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

/**
 * Builds an error envelope.
 *
 * @param code    - Machine-readable error code.
 * @param message - Human-readable error message.
 * @param details - Optional structured details.
 * @returns       Standard error response object.
 */
export function errorResponse(
  code: string,
  message: string,
  details?: unknown,
): ApiError {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
}

/**
 * Calculates pagination meta from raw counts.
 *
 * @param total - Total number of records.
 * @param page  - Current page (1-based).
 * @param limit - Page size.
 * @returns PaginationMeta object.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
