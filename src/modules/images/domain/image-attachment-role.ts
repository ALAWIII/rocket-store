import { ValueOf } from 'src/shared/types/value-of';

export const ImageAttachmentRole = {
  MAIN: 'MAIN', // the default main product image on the product details page
  GALLERY: 'GALLERY', //additional product images the user can browse
  THUMBNAIL: 'THUMBNAIL', // small preview image used in carts, lists, mini cards, or gallery strip
} as const;

export type ImageAttachmentRole = ValueOf<typeof ImageAttachmentRole>;
