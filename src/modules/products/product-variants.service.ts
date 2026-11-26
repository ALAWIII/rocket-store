import { Injectable } from '@nestjs/common';
import { IProductVariantRepository } from './infrastructure/repositories/product-variant.repository';
import { CreateProductVariantDto } from './dto/request/write/create-product-variant.dto';
import { ProductVariant } from './domain/product-variant';
import { ProductVariantResponseDto } from './dto/response/product-variant-response.dto';
import { UpdateProductVariantDto } from './dto/request/write/update-product-variant.dto';
import { UpdateVariantsSortOrderDto } from './dto/request/write/update-variant-sort-order.dto';
import { ProductVariantImagesDto } from './dto/request/write/product-variant-images.dto';
import { ProductVariantImage } from './domain/product-variant-image';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
import { AffectedResponseDto } from '../shared/dto/affected-response.dto';
import { ProductVisibility } from './domain/product-visibility';

@Injectable()
export class ProductsVariantsService {
  constructor(private readonly pvariantRepo: IProductVariantRepository) {}
  create(productId: string, data: CreateProductVariantDto): Promise<ProductVariantResponseDto> {
    const variant = ProductVariant.create({
      ...data,
      productId,
      visibility: data.visibility ?? 'private',
      salesStatus: data.salesStatus ?? 'active',
    }).unwrap();
    return this.pvariantRepo
      .create(variant)
      .map((pv) => pv.toJSON())
      .unwrap();
  }
  findById(productId: string, variantId: string, visibility?: ProductVisibility): Promise<ProductVariantResponseDto> {
    return this.pvariantRepo
      .findById(productId, variantId, visibility)
      .map((pv) => pv.toJSON())
      .unwrap();
  }
  findAll(productId: string, visibility?: ProductVisibility): Promise<ProductVariantResponseDto[]> {
    return this.pvariantRepo
      .findAll(productId, visibility)
      .map((pvs) => pvs.map((pv) => pv.toJSON()))
      .unwrap();
  }
  update(productId: string, variantId: string, data: UpdateProductVariantDto): Promise<ProductVariantResponseDto> {
    return this.pvariantRepo
      .update(productId, variantId, data)
      .map((pv) => pv.toJSON())
      .unwrap();
  }
  updateSortOrder(productId: string, orders: UpdateVariantsSortOrderDto): Promise<ProductVariantResponseDto[]> {
    return this.pvariantRepo
      .updateSortOrders(productId, orders.orders)
      .map((pvs) => pvs.map((pv) => pv.toJSON()))
      .unwrap();
  }
  attachImages(variantId: string, data: ProductVariantImagesDto): Promise<ImageResponseDto[]> {
    const images = data.images.map((img) =>
      ProductVariantImage.create({ ...img, productVaraintId: variantId }).unwrap(),
    );
    return this.pvariantRepo
      .attachImages(images)
      .map((imgs) => imgs.map((img) => img.toJSON()))
      .unwrap();
  }
  detachImages(variantId: string, imageIds: string[]): Promise<AffectedResponseDto> {
    return this.pvariantRepo
      .detachImages(variantId, imageIds)
      .map((affected) => ({ affected }))
      .unwrap();
  }
  updateVariantImageSortOrders(variantId: string, images: ProductVariantImagesDto): Promise<AffectedResponseDto> {
    return this.pvariantRepo
      .updateVariantImageSortOrders(variantId, images.images)
      .map((affected) => ({ affected }))
      .unwrap();
  }
}
