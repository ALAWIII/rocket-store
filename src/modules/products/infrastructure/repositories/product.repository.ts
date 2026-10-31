import { DBResult } from 'src/modules/shared/errors/error.types';
import { Product } from '../../domain/product';
import { ProductStatus } from '../../domain/product-status';
import { ProductImage } from '../../domain/product-image';
import { Image } from 'src/modules/images/domain/image';
import { ProductEntity } from '../entities/product.entity';
import { ProductVariantWithImages } from '../mappers/product-variant.mapper';
import { BrandWithLogo } from 'src/modules/brands/infrastructure/mappers/brand.mapper';
import { CategoryEntity } from 'src/modules/categories/infrastructure/entities/category.entity';
import { ProductDetails } from '../../domain/product-details';
import { Pagination } from 'src/modules/shared/types/pagination';

export type ProductDetailsResult = {
  product: ProductEntity;
  variants: ProductVariantWithImages[];
  brand: BrandWithLogo | null;
  categories: CategoryEntity[];
};
export type FindProductByIdQueryFlags = { variants: boolean; brand: boolean; categories: boolean };

export type ProductCategory = {
  productId: string;
  categoryId: string;
};

export type UpdateProduct = {
  title?: string;
  description?: string;
  brandId?: string | null;
  pageId?: string | null;
  status?: ProductStatus;
};
export type FindAllProductsSearchOptions = {
  search?: string;
  status?: ProductStatus;
  brandId?: string;
  category?: {
    categoryIds: string[];
    includeCategoryDescendants?: boolean;
  };
  page?: number;
  limit?: number;
};
export type FindAllProductsQueryResult = { products: Product[]; pagination: Pagination };

export abstract class IProductRepository {
  abstract create(product: Product): DBResult<Product>;
  abstract findAll(options: FindAllProductsSearchOptions): DBResult<FindAllProductsQueryResult>;
  abstract findById(productId: string, include: FindProductByIdQueryFlags): DBResult<ProductDetails>;
  abstract update(productId: string, data: UpdateProduct): DBResult<Product>;
  abstract attachImages(images: ProductImage[]): DBResult<Image[]>;
  abstract detachImages(productId: string, imageIds: string[]): DBResult<number>;
  abstract attachCategories(data: ProductCategory[]): DBResult<ProductCategory[]>;
  abstract detachCategories(productId: string, categoryIds: string[]): DBResult<number>;
}
