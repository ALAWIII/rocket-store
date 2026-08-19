export const IMAGE_ENTITY_TYPES = [
  'PRODUCT',
  'PRODUCT_VARIANT',
  'BRAND',
  'CATEGORY',
  'USER',
] as const;

export type ImageEntityType = (typeof IMAGE_ENTITY_TYPES)[number];
