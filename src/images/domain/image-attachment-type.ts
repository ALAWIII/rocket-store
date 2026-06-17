export const ImageAttachmentEntityType = {
  PRODUCT: 'PRODUCT',
  PRODUCT_VARIANT: 'PRODUCT_VARIANT',
  BRAND: 'BRAND',
  CATEGORY: 'CATEGORY',
  USER: 'USER',
} as const;

export type ImageAttachmentEntityType =
  (typeof ImageAttachmentEntityType)[keyof typeof ImageAttachmentEntityType];
