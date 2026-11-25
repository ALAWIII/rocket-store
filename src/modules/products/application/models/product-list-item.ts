import { ProductItem } from './product-item';
import { ProductVariantItem } from './product-variant-item';

export type ProductListItem = {
  product: ProductItem;
  variants?: ProductVariantItem[];
};
