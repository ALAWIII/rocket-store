export const SORT_BY_OPTIONS = ['created', 'updated', 'title', 'price', 'rating'] as const;
export type SortByOptions = (typeof SORT_BY_OPTIONS)[number];
