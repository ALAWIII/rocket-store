import { InjectRepository } from '@nestjs/typeorm';
import { IProductRepository, ProductCategory, UpdateProduct } from './product.repository';
import { ProductEntity } from '../entities/product.entity';
import { ProductImageEntity } from '../entities/product-image.entity';
import { In, Repository } from 'typeorm';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Product } from '../../domain/product';
import { Ok, Result } from '@allawiii/results-ts';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { RecordNotFoundError, UnknownDatabaseError } from 'src/modules/shared/errors/database.error';
import { ProductMapper } from '../mappers/product.mapper';
import { ProductCategoryEntity } from '../entities/product-category.entity';

export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly productImageRepo: Repository<ProductImageEntity>,
    @InjectRepository(ProductCategoryEntity)
    private readonly productCategoryRepo: Repository<ProductCategoryEntity>,
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
  update(productId: string, data: UpdateProduct): DBResult<Product> {
    return Result.wrapAsync(async () => {
      const result = await this.productRepo
        .createQueryBuilder()
        .update()
        .set({ ...data, updatedAt: () => 'now()' })
        .where('id = :productId', { productId })
        .returning('*')
        .execute();
      if (result.affected === 0) throw new RecordNotFoundError(`Product not found, productId: ${productId}`);

      const row = result.raw?.[0] as ProductEntity | undefined;

      if (!row) throw new UnknownDatabaseError(`Product update did not return a row, productId: ${productId}`);
      return row;
    })
      .mapErr(mapTypeOrmError)
      .andThen((product) => ProductMapper.toDomain(product));
  }
  attachCategories(data: ProductCategory[]): DBResult<ProductCategory[]> {
    return Result.wrapAsync(async () =>
      this.productCategoryRepo.createQueryBuilder().insert().values(data).returning('*').execute(),
    )
      .map((pc) => pc.raw as ProductCategory[])
      .mapErr(mapTypeOrmError);
  }
  detachCategories(productId: string, categoryIds: string[]): DBResult<number> {
    if (!categoryIds.length) return Ok(0).toAsyncResult();
    return Result.wrapAsync(() => this.productCategoryRepo.delete({ productId, categoryId: In(categoryIds) }))
      .map((result) => result.affected ?? 0)
      .mapErr(mapTypeOrmError);
  }
}
