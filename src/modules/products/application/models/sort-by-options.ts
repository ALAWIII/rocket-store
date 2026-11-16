export const SORT_BY_OPTIONS = ['created', 'updated', 'title', 'price', 'stars'] as const;
export type SortByOptions = (typeof SORT_BY_OPTIONS)[number];
