import { Repository } from 'typeorm';
import { IProductVariantRepository, UpdateVariant, VariantSortOrderUpdate } from './product-variant.repository';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { ProductVariant } from '../../domain/product-variant';
import { Result } from '@allawiii/results-ts';
import { ProductVariantImageEntity } from '../entities/product-variant-image.entity';
import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { ProductVariantMapper, ProductVariantWithImages } from '../mappers/product-variant.mapper';
import { RecordNotFoundError, UnknownDatabaseError } from 'src/modules/shared/errors/database.error';
import { UPDATE_PRODUCT_VARIANT_SORT_ORDER_SQL } from './queries/update-product-variant-sort-order.query';
import { Image } from 'src/modules/images/domain/image';
import { ProductVariantImage } from '../../domain/product-variant-image';
import { ImageMapper } from 'src/modules/images/infrastructure/mappers/images.mapper';

export class ProductVariantRepository implements IProductVariantRepository {
  constructor(
    @InjectRepository(ProductVariantEntity)
    private readonly productVariantRepo: Repository<ProductVariantEntity>,
    @InjectRepository(ProductVariantImageEntity)
    private readonly productVariantImageRepo: Repository<ProductVariantImageEntity>,
  ) {}
  create(variant: ProductVariant): DBResult<ProductVariant> {
    return Result.wrapAsync(async () => {
      const { images, ...variantJson } = variant.toJSON();
      const result = await this.productVariantRepo
        .createQueryBuilder()
        .insert()
        .values(variantJson)
        .returning('*')
        .execute();
      const row = result.raw?.[0] as ProductVariantEntity | undefined;
      if (!row)
        throw new UnknownDatabaseError(`Inserting new product variant did not return it's fields: ${variantJson.id}`);
      return row;
    })
      .mapErr(mapTypeOrmError)
      .andThen((pvariant) => ProductVariantMapper.toDomain(pvariant));
  }
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
  update(productId: string, variantId: string, data: UpdateVariant): DBResult<ProductVariant> {
    return Result.wrapAsync(async () => {
      const result = await this.productVariantRepo
        .createQueryBuilder()
        .update()
        .set(data)
        .where('id = :variantId', { variantId })
        .andWhere('"productId" = :productId', { productId })
        .returning('*')
        .execute();
      if (result.affected === 0)
        throw new RecordNotFoundError(`ProductVariant not found, productId: ${productId}, variantId: ${variantId}`);

      const row = result.raw?.[0] as ProductVariantEntity | undefined;

      if (!row)
        throw new UnknownDatabaseError(
          `ProductVariant update did not return a row, productId: ${productId}, variantId: ${variantId}`,
        );
      return row;
    })
      .andThen((pvariant) => ProductVariantMapper.toDomain(pvariant))
      .mapErr(mapTypeOrmError);
  }
  updateSortOrders(productId: string, ordering: VariantSortOrderUpdate[]): DBResult<ProductVariant[]> {
    return Result.wrapAsync(async () => {
      const variantIds = ordering.map((x) => x.variantId);
      const sortOrders = ordering.map((x) => x.sortOrder);

      const rows = await this.productVariantRepo.query<ProductVariantEntity[]>(UPDATE_PRODUCT_VARIANT_SORT_ORDER_SQL, [
        variantIds,
        sortOrders,
        productId,
      ]);
      if (rows.length !== ordering.length) {
        throw new RecordNotFoundError('Some product variants were not found');
      }
      return rows;
    })
      .mapErr(mapTypeOrmError)
      .andThen((pvariants) => ProductVariantMapper.toDomainList(pvariants));
  }

  attachImages(images: ProductVariantImage[]): DBResult<Image[]> {
    return Result.wrapAsync(() => {
      const imagesJson = images.map((pimg) => pimg.toJSON());
      const insertCte = this.productVariantImageRepo
        .createQueryBuilder()
        .insert()
        .into(ProductVariantImageEntity)
        .values(imagesJson)
        .orIgnore()
        .returning('"imageId"');
      return this.productVariantImageRepo.manager
        .createQueryBuilder(ImageEntity, 'images')
        .addCommonTableExpression(insertCte, 'image_ids')
        .where('images.id IN (SELECT "imageId" FROM image_ids)')
        .getMany();
    })
      .mapErr(mapTypeOrmError)
      .andThen((imgs) => ImageMapper.toDomainList(imgs));
  }
}
