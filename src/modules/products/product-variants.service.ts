import { Injectable } from '@nestjs/common';
import { IProductVariantRepository } from './infrastructure/repositories/product-variant.repository';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { ProductVariant } from './domain/product-variant';
import { ProductVariantResponseDto } from './dto/product-variant-response.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { UpdateVariantsSortOrderDto } from './dto/update-variant-sort-order.dto';
import { AttachProductVariantImagesDto } from './dto/attach-images-to-product-variant.dto';
import { ProductVariantImage } from './domain/product-variant-image';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
import { DetachObjectResponseDto } from '../shared/dto/detach-object-response.dto';

@Injectable()
export class ProductsVariantsService {
  constructor(private readonly pvariantRepo: IProductVariantRepository) {}
  create(data: CreateProductVariantDto): Promise<ProductVariantResponseDto> {
    const variant = ProductVariant.create(data).unwrap();
    return this.pvariantRepo
      .create(variant)
      .map((pv) => pv.toJSON())
      .unwrap();
  }
  findById(productId: string, variantId: string): Promise<ProductVariantResponseDto> {
    return this.pvariantRepo
      .findById(productId, variantId)
      .map((pv) => pv.toJSON())
      .unwrap();
  }
  findAll(productId: string): Promise<ProductVariantResponseDto[]> {
    return this.pvariantRepo
      .findAll(productId)
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
  attachImages(variantId: string, data: AttachProductVariantImagesDto): Promise<ImageResponseDto[]> {
    const images = data.images.map((img) =>
      ProductVariantImage.create({ ...img, productVaraintId: variantId }).unwrap(),
    );
    return this.pvariantRepo
      .attachImages(images)
      .map((imgs) => imgs.map((img) => img.toJSON()))
      .unwrap();
  }
  detachImages(variantId: string, imageIds: string[]): Promise<DetachObjectResponseDto> {
    return this.pvariantRepo
      .detachImages(variantId, imageIds)
      .map((affected) => ({ affected }))
      .unwrap();
  }
}
