import { ProductEntity } from '../entities/product.entity';
import { CorruptedPersistenceDataError, DatabaseError } from 'src/modules/shared/errors/database.error';
import { Product } from '../../domain/product';
import { ImageMapper } from 'src/modules/images/infrastructure/mappers/images.mapper';
import { Result } from '@allawiii/results-ts';
import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';

export type ProductQueryResult = ProductEntity & {
  coverImage?: ImageEntity;
  categoryIds?: string[];
};

export class ProductMapper {
  static toDomain(product: ProductQueryResult): Result<Product, DatabaseError> {
    const coverImage = product.coverImage ? ImageMapper.toDomain(product.coverImage) : undefined;
    if (coverImage?.isErr()) return coverImage.map();

    return Product.restore({ ...product, coverImage: coverImage?.unwrap() }).mapErr(
      (e) => new CorruptedPersistenceDataError(`Failed to construct Product from ProductEntity: ${e.message}`, e),
    );
  }
  static toDomainList(products: ProductQueryResult[]): Result<Product[], DatabaseError> {
    return Result.wrap(() => products.map((product) => this.toDomain(product).unwrap()));
  }
}
