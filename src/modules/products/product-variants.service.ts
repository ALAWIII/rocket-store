import { Injectable } from '@nestjs/common';
import { IProductVariantRepository } from './infrastructure/repositories/product-variant.repository';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { ProductVariant } from './domain/product-variant';
import { ProductVariantResponseDto } from './dto/product-variant-response.dto';

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
}
