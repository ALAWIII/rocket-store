import { DBResult } from 'src/modules/shared/errors/error.types';
import { ProductVariant } from '../../domain/product-variant';
import { ProductStatus } from '../../domain/product-status';
import { Image } from 'src/modules/images/domain/image';
import { ProductVariantImage } from '../../domain/product-variant-image';
import { JsonObject } from 'src/modules/shared/value-objects/json-object';
export type UpdateVariant = {
  price?: number;
  quantity?: number;
  description?: string | null;
  status?: ProductStatus;
  info?: JsonObject;
};
export type VariantSortOrderUpdate = {
  variantId: string;
  sortOrder: number;
};

export abstract class IProductVariantRepository {
  abstract create(variant: ProductVariant): DBResult<ProductVariant>;
  abstract findAll(productId: string): DBResult<ProductVariant[]>;
  abstract findById(productId: string, variantId: string): DBResult<ProductVariant>;
  abstract update(productId: string, variantId: string, data: UpdateVariant): DBResult<ProductVariant>;
  abstract updateSortOrders(productId: string, ordering: VariantSortOrderUpdate[]): DBResult<ProductVariant[]>;
  abstract attachImages(images: ProductVariantImage[]): DBResult<Image[]>;
  abstract detachImages(variantId: string, imageIds: string[]): DBResult<number>;
}
