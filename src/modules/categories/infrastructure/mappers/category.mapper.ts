import { Result } from '@allawiii/results-ts';
import { CategoryEntity } from '../entities/category.entity';
import { Category } from '../../domain/category';
import { CorruptedPersistenceDataError, DatabaseError } from 'src/modules/shared/errors/database.error';
import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import { ImageMapper } from 'src/modules/images/infrastructure/mappers/images.mapper';

export type CategoryWithImgs = CategoryEntity & {
  icon?: ImageEntity;
  thumbnail?: ImageEntity;
};

export class CategoryMapper {
  static toDomain(cat: CategoryWithImgs): Result<Category, DatabaseError> {
    const imgs = Result.wrap(() => {
      return {
        thumbnail: cat.thumbnail ? ImageMapper.toDomain(cat.thumbnail).unwrap() : undefined,
        icon: cat.icon ? ImageMapper.toDomain(cat.icon).unwrap() : undefined,
      };
    });
    if (imgs.isErr()) return imgs.map() as Result<Category, DatabaseError>;

    return Category.restore({ ...cat, ...imgs.unwrap() }).mapErr(
      (e) => new CorruptedPersistenceDataError(`Failed to construct Category from CategoryEntity: ${e.message}`, e),
    );
  }
  static toDomainList(cats: CategoryEntity[]): Result<Category[], DatabaseError> {
    return Result.wrap(() => cats.map((c) => this.toDomain(c).unwrap()));
  }
}
