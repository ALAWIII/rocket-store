import { DBResult } from 'src/modules/shared/errors/error.types';
import { Product } from '../../domain/product';
import { ProductStatus } from '../../domain/product-status';
import { ProductImage } from '../../domain/product-image';
import { Image } from 'src/modules/images/domain/image';

export type ProductCategory = {
  productId: string;
  categoryId: string;
};
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
export type UpdateProduct = {
  title?: string;
  description?: string;
  brandId?: string | null;
  pageId?: string | null;
  status?: ProductStatus;
};
export type FindAllProductsQuery = {
  search?: string;
  status?: ProductStatus;
  brandId?: string;
  categoryIds?: string[];
  includeCategoryDescendants?: boolean;
  page?: number;
  limit?: number;
};
export abstract class IProductRepository {
  abstract create(product: Product): DBResult<Product>;
  abstract findAll(options: FindAllProductsQuery): DBResult<Paginated<Product>>;
  abstract findById(productId: string): DBResult<Product>;
  abstract update(productId: string, data: UpdateProduct): DBResult<Product>;
  abstract attachImages(images: ProductImage[]): DBResult<Image[]>;
  abstract detachImages(productId: string, imageIds: string[]): DBResult<number>;
  abstract attachCategories(data: ProductCategory[]): DBResult<ProductCategory[]>;
  abstract detachCategories(productId: string, categoryIds: string[]): DBResult<number>;
}
