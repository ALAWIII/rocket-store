import { Injectable } from '@nestjs/common';
import { IProductRepository } from './infrastructure/repositories/product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './domain/product';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly productRepo: IProductRepository) {}
  create(data: CreateProductDto): Promise<ProductResponseDto> {
    return Product.create(data)
      .toAsyncResult()
      .andThen((p) => this.productRepo.create(p))
      .map((p) => p.toJSON())
      .unwrap();
  }
}
