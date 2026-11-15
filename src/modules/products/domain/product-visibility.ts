export const PRODUCT_STATUS = ['public', 'private'] as const;
export type ProductVisibility = (typeof PRODUCT_STATUS)[number];
