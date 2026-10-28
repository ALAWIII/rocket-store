import { Brand } from 'src/modules/brands/domain/brand';
import { Product } from './product';
import { ProductVariant } from './product-variant';
import { Category } from 'src/modules/categories/domain/category';

export interface ProductDetails {
  product: Product;
  brand: Brand | null;
  variants: ProductVariant[];
  categories: Category[];
}
