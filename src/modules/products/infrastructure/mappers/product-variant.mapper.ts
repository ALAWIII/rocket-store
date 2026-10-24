import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { Result } from '@allawiii/results-ts';
import { ProductVariant } from '../../domain/product-variant';
import { CorruptedPersistenceDataError, DatabaseError } from 'src/modules/shared/errors/database.error';
import { ImageMapper } from 'src/modules/images/infrastructure/mappers/images.mapper';
import { JsonObject } from 'src/modules/shared/value-objects/json-object';

export type ProductVariantWithImages = ProductVariantEntity & {
  images?: ImageEntity[];
};

export class ProductVariantMapper {
  static toDomain(pvariant: ProductVariantWithImages): Result<ProductVariant, DatabaseError> {
    const imgs = ImageMapper.toDomainList(pvariant.images ?? []);
    if (imgs.isErr()) return imgs.map() as Result<ProductVariant, DatabaseError>;

    return ProductVariant.restore({ ...pvariant, images: imgs.unwrap(), info: pvariant.info as JsonObject }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(
          `Failed to construct ProductVariant from ProductVariantEntity: ${e.message}`,
          e,
        ),
    );
  }
  static toDomainList(pvariants: ProductVariantWithImages[]): Result<ProductVariant[], DatabaseError> {
    return Result.wrap(() => pvariants.map((pvariant) => this.toDomain(pvariant).unwrap()));
  }
}
