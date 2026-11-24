import { DBResult } from 'src/modules/shared/errors/error.types';
import { ProductVariant } from '../../domain/product-variant';
import { ProductVisibility } from '../../domain/product-visibility';
import { Image } from 'src/modules/images/domain/image';
import { ProductVariantImage } from '../../domain/product-variant-image';
import { JsonObject } from 'src/modules/shared/value-objects/json-object';
import { ProductSalesStatus } from '../../domain/product-sales-status';
export type UpdateVariant = {
  title?: string;
  price?: number;
  description?: string | null;
  visibility?: ProductVisibility;
  salesStatus?: ProductSalesStatus;
  info?: JsonObject;
};
export type VariantSortOrderUpdate = {
  variantId: string;
  sortOrder: number;
};
export type VariantImageSortOrderUpdate = {
  imageId: string;
  sortOrder: number;
};
export abstract class IProductVariantRepository {
  abstract create(variant: ProductVariant): DBResult<ProductVariant>;
  abstract findAll(productId: string): DBResult<ProductVariant[]>;
  abstract findById(productId: string, variantId: string): DBResult<ProductVariant>;
  abstract update(productId: string, variantId: string, data: UpdateVariant): DBResult<ProductVariant>;
  abstract updateSortOrders(productId: string, ordering: VariantSortOrderUpdate[]): DBResult<ProductVariant[]>;
  abstract updateVariantImageSortOrders(
    productVariantId: string,
    ordering: VariantImageSortOrderUpdate[],
  ): DBResult<number>;
  abstract attachImages(images: ProductVariantImage[]): DBResult<Image[]>;
  abstract detachImages(variantId: string, imageIds: string[]): DBResult<number>;
}
