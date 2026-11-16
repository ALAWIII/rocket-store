export const PRODUCT_VISIBILITY = ['public', 'private'] as const;
export type ProductVisibility = (typeof PRODUCT_VISIBILITY)[number];
