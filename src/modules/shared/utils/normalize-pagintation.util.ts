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

export function normalizePagination(pagination: { page?: number; limit?: number }) {
  const rawPage = Number(pagination.page ?? 1);
  const rawLimit = Number(pagination.limit ?? 25);

  const pageValue = Math.floor(rawPage);
  const limitValue = Math.floor(rawLimit);

  const page = Number.isFinite(rawPage) && pageValue >= 1 ? pageValue : 1;

  const limit = Number.isFinite(rawLimit) && limitValue >= 1 ? Math.min(limitValue, 100) : 25;

  return { page, limit };
}
