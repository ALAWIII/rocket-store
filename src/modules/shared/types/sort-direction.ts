export const SORT_DIRECTION = ['ASC', 'DESC'] as const;
export type SortDirection = (typeof SORT_DIRECTION)[number];
