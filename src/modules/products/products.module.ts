import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './infrastructure/entities/product.entity';
import { ProductVariantEntity } from './infrastructure/entities/product-variant.entity';
import { ProductCategoryEntity } from './infrastructure/entities/product-category.entity';
import { ProductImageEntity } from './infrastructure/entities/product-image.entity';
import { ProductVariantImageEntity } from './infrastructure/entities/product-variant-image.entity';
import { IProductRepository } from './infrastructure/repositories/product.repository';
import { ProductRepository } from './infrastructure/repositories/product.typeorm.repository';
import { IProductVariantRepository } from './infrastructure/repositories/product-variant.repository';
import { ProductVariantRepository } from './infrastructure/repositories/product-variant.typeorm.repository';
import { ProductsController } from './products.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductVariantEntity,
      ProductCategoryEntity,
      ProductImageEntity,
      ProductVariantImageEntity,
    ]),
  ],
  providers: [
    ProductsService,
    { provide: IProductRepository, useClass: ProductRepository },
    { provide: IProductVariantRepository, useClass: ProductVariantRepository },
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}
