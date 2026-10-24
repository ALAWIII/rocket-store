import { Repository } from 'typeorm';
import { IProductVariantRepository } from './product-variant.repository';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { ProductVariant } from '../../domain/product-variant';
import { Result } from '@allawiii/results-ts';
import { ProductVariantImageEntity } from '../entities/product-variant-image.entity';
import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { ProductVariantMapper, ProductVariantWithImages } from '../mappers/product-variant.mapper';

export class ProductVariantRepository implements IProductVariantRepository {
  constructor(
    @InjectRepository(ProductVariantEntity)
    private readonly productVariantRepo: Repository<ProductVariantEntity>,
  ) {}
  findAll(productId: string): DBResult<ProductVariant[]> {
    return Result.wrapAsync(() =>
      this.productVariantRepo
        .createQueryBuilder('pvariant')
        .leftJoin(ProductVariantImageEntity, 'pvariant_images', 'pvariant_images."productVariantId" = pvariant.id')
        .leftJoinAndMapMany('pvariant.images', ImageEntity, 'images', 'images.id = pvariant_images."imageId"')
        .where('pvariant."productId" = :productId', { productId })
        .getMany(),
    )
      .mapErr(mapTypeOrmError)
      .andThen((pvariants: ProductVariantWithImages[]) => ProductVariantMapper.toDomainList(pvariants));
  }
  findById(productId: string, variantId: string): DBResult<ProductVariant> {
    return Result.wrapAsync(() =>
      this.productVariantRepo
        .createQueryBuilder('pvariant')
        .leftJoin(ProductVariantImageEntity, 'pvariant_images', 'pvariant_images."productVariantId" = pvariant.id')
        .leftJoinAndMapMany('pvariant.images', ImageEntity, 'images', 'images.id = pvariant_images."imageId"')
        .where('pvariant."productId" = :productId', { productId })
        .andWhere('pvariant.id = :variantId', { variantId })
        .getOneOrFail(),
    )
      .mapErr(mapTypeOrmError)
      .andThen((pvariant: ProductVariantWithImages) => ProductVariantMapper.toDomain(pvariant));
  }
}
