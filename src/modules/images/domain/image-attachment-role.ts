import { ValueOf } from 'src/modules/shared/types/value-of';

export const ImageAttachmentRole = {
  MAIN: 'main', // the default main product image on the product details page
  GALLERY: 'gallery', //additional product images the user can browse
  THUMBNAIL: 'thumbnail', // small preview image used in carts, lists, mini cards, or gallery strip
} as const;

export type ImageAttachmentRole = ValueOf<typeof ImageAttachmentRole>;
