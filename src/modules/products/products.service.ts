import { Injectable } from '@nestjs/common';
import { IProductRepository } from './infrastructure/repositories/product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './domain/product';
import { ProductResponseDto } from './dto/product-response.dto';
import { FindByIdQuery } from './dto/find-by-id-query.dto';
import { ProductDetailsResponseDto } from './dto/product-details-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductCategoriesResponseDto } from './dto/product-categories-response.dto';

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
  findById(productId: string, query: FindByIdQuery): Promise<ProductDetailsResponseDto> {
    return this.productRepo
      .findById(productId, {
        brand: query.include.includes('brand'),
        categories: query.include.includes('categories'),
        variants: query.include.includes('variants'),
      })
      .map((p) => p.toJSON())
      .unwrap();
  }
  update(productId: string, data: UpdateProductDto): Promise<ProductResponseDto> {
    return this.productRepo
      .update(productId, data)
      .map((p) => p.toJSON())
      .unwrap();
  }
  attachCategories(productId: string, categoryIds: string[]): Promise<ProductCategoriesResponseDto> {
    const productCategories = [...new Set(categoryIds)].map((categoryId) => ({ productId, categoryId }));

    return this.productRepo
      .attachCategories(productCategories)
      .map((pcs) => ({ categoryIds: pcs.map((pc) => pc.categoryId) }))
      .unwrap();
  }
}
