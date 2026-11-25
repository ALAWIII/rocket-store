import { DBResult } from 'src/modules/shared/errors/error.types';
import { Product, ProductFields } from '../../domain/product';
import { ProductVisibility } from '../../domain/product-visibility';
import { ProductImage } from '../../domain/product-image';
import { Image } from 'src/modules/images/domain/image';
import { ProductEntity } from '../entities/product.entity';
import { ProductVariantWithImages } from '../mappers/product-variant.mapper';
import { BrandWithLogo } from 'src/modules/brands/infrastructure/mappers/brand.mapper';
import { CategoryEntity } from 'src/modules/categories/infrastructure/entities/category.entity';
import { OutputPagination } from 'src/modules/shared/types/pagination';
import { SortDirection } from 'src/modules/shared/types/sort-direction';
import { ProductSalesStatus } from '../../domain/product-sales-status';
import { SortByOptions } from '../../application/models/sort-by-options';
import { ProductVariantFields } from '../../domain/product-variant';
import { ProductDetails } from '../../application/models/product-details';
import { ProductListItem } from '../../application/models/product-list-item';

export type ProductDetailsResult = {
  product: ProductEntity;
  variants: ProductVariantWithImages[];
  brand: BrandWithLogo | null;
  categories: CategoryEntity[];
};
export type FindProductByIdQueryFlags = {
  variants: boolean;
  brand: boolean;
  categories: boolean;
  visibility?: ProductVisibility;
  variantVisibility?: ProductVisibility;
};

export type ProductCategory = {
  productId: string;
  categoryId: string;
};

export type UpdateProduct = {
  title?: string;
  description?: string;
  brandId?: string | null;
  pageId?: string | null;
  salesStatus?: ProductSalesStatus;
  visibility?: ProductVisibility;
};
export type FindAllProductsSearchOptions = {
  // filters and conditions
  search?: string;
  visibility?: ProductVisibility;
  variantVisibility?: ProductVisibility;
  salesStatus?: ProductSalesStatus;
  brandId?: string;
  category?: {
    categoryIds: string[];
    includeCategoryDescendants?: boolean;
  };

  minPrice?: number;
  maxPrice?: number;

  // fields to include.
  product?: ProductFields[];
  variant?: ProductVariantFields[];
  // ordering and sorting
  sort?: {
    field: SortByOptions;
    direction: SortDirection;
  };
  // pagination
  page?: number;
  limit?: number;
};
export type FindAllProductsQueryResult = { products: ProductListItem[]; pagination: OutputPagination };

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
