import { ValueOf } from 'src/modules/shared/types/value-of';

export const ImageAttachmentEntityType = {
  PRODUCT: 'product',
  PRODUCT_VARIANT: 'product_variant',
  BRAND: 'brand',
  CATEGORY: 'category',
  USER: 'user',
} as const;

export type ImageAttachmentEntityType = ValueOf<
  typeof ImageAttachmentEntityType
>;
