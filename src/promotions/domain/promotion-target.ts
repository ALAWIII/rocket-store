import { ValueOf } from 'src/shared/types/value-of';

export const PromotionTargetType = {
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY',
  BRAND: 'BRAND',
  ORDER: 'ORDER',
  SHIPPING: 'SHIPPING',
} as const;

export type PromotionTargetType = ValueOf<typeof PromotionTargetType>;
