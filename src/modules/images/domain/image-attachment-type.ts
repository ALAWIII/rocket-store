import { ValueOf } from 'src/modules/shared/types/value-of';

export const ImageAttachmentEntityType = {
  PRODUCT: 'PRODUCT',
  PRODUCT_VARIANT: 'PRODUCT_VARIANT',
  BRAND: 'BRAND',
  CATEGORY: 'CATEGORY',
  USER: 'USER',
} as const;

export type ImageAttachmentEntityType = ValueOf<
  typeof ImageAttachmentEntityType
>;
