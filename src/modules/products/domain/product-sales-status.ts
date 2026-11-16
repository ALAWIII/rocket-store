export const PRODUCT_SALES_STATUS = ['active', 'paused'] as const;
export type ProductSalesStatus = (typeof PRODUCT_SALES_STATUS)[number];
