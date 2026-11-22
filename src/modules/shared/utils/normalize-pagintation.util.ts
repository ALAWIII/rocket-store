/**
 * Normalizes pagination options.
 *
 * Defaults:
 * - page: 1
 * - limit: 25
 *
 * Constraints:
 * - Page must be a positive integer.
 * - Limit must be a positive integer.
 * - Maximum limit is 100.
 */

import { Pagination } from '../types/pagination';

export function normalizePagination(page = 1, limit = 20, maxLimit = 100): Pagination {
  const p = Number(page);
  const l = Number(limit);

  return {
    page: Number.isInteger(p) && p >= 1 ? p : 1,
    limit: Number.isInteger(l) && l >= 1 ? Math.min(l, maxLimit) : 20,
  };
}
