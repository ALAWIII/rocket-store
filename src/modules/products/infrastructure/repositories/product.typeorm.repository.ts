import { InjectRepository } from '@nestjs/typeorm';
import { IProductRepository } from './product.repository';
import { ProductEntity } from '../entities/product.entity';
import { ProductImageEntity } from '../entities/product-image.entity';
import { Repository } from 'typeorm';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Product } from '../../domain/product';
import { Result } from '@allawiii/results-ts';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { UnknownDatabaseError } from 'src/modules/shared/errors/database.error';
import { ProductMapper } from '../mappers/product.mapper';

export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly productImageRepo: Repository<ProductImageEntity>,
  ) {}

  create(product: Product): DBResult<Product> {
    const { categoryIds: categories, coverImage, ...productJson } = product.toJSON();
    return Result.wrapAsync(async () => {
      const result = await this.productRepo.createQueryBuilder().insert().values(productJson).returning('*').execute();
      const row = result.raw?.[0] as ProductEntity | undefined;
      if (!row) throw new UnknownDatabaseError(`Inserting new product did not return it's fields: ${productJson.id}`);
      return row;
    })
      .mapErr(mapTypeOrmError)
      .andThen((product) => ProductMapper.toDomain(product));
  }
}
