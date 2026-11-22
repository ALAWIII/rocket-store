export const SORT_BY_OPTIONS = ['createdAt', 'updatedAt', 'title', 'price'] as const;
export type SortByOptions = (typeof SORT_BY_OPTIONS)[number];
