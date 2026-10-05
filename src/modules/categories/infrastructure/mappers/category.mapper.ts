import { Result } from '@allawiii/results-ts';
import { CategoryEntity } from '../entities/category.entity';
import { Category } from '../../domain/category';
import { CorruptedPersistenceDataError, DatabaseError } from 'src/modules/shared/errors/database.error';

export class CategoryMapper {
  static toDomain(cat: CategoryEntity): Result<Category, DatabaseError> {
    return Category.restore(cat).mapErr(
      (e) => new CorruptedPersistenceDataError(`Failed to construct Category from CategoryEntity: ${e.message}`, e),
    );
  }
  static toDomainList(cats: CategoryEntity[]): Result<Category[], DatabaseError> {
    return Result.wrap(() => cats.map((c) => this.toDomain(c).unwrap()));
  }
}
