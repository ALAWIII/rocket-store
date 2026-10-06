import { DBResult } from 'src/modules/shared/errors/error.types';
import { Category } from '../../domain/category';
import { ICategoryRepository } from './category.repository';
import { Result } from '@allawiii/results-ts';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryMapper } from '../mappers/category.mapper';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { ConflictError, RecordNotFoundError, UnknownDatabaseError } from 'src/modules/shared/errors/database.error';
import { MOVE_CATEGORY_SQL, MOVE_STATUS, MOVE_STATUS_CODES } from './queries/move-category.query';
import { DELETE_CATEGORY_SQL } from './queries/delete-category.query';

export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categRepo: Repository<CategoryEntity>,
  ) {}
  findAll(): DBResult<Category[]> {
    return Result.wrapAsync(() => this.categRepo.find({ order: { path: 'ASC' } }))
      .andThen((c) => CategoryMapper.toDomainList(c))
      .mapErr(mapTypeOrmError);
  }
  findById(id: string): DBResult<Category> {
    return Result.wrapAsync(() => this.categRepo.findOneByOrFail({ id }))
      .andThen((c) => CategoryMapper.toDomain(c))
      .mapErr(mapTypeOrmError);
  }
  findSubtree(id: string): DBResult<Category[]> {
    return Result.wrapAsync(() =>
      this.categRepo
        .createQueryBuilder('c')
        .where('c.path @> :id::uuid[]', { id: [id] })
        .orderBy('c.path', 'ASC')
        .getMany(),
    )
      .andThen((c) => CategoryMapper.toDomainList(c))
      .mapErr(mapTypeOrmError);
  }

  create(data: Category): DBResult<Category> {
    return Result.wrapAsync(() => {
      const sql = `
      INSERT INTO categories (id, name, description, "parentId", path)
      SELECT $1, $2, $3, $4,
        CASE
          WHEN $4 IS NULL THEN ARRAY[$1]::uuid[]
          ELSE (SELECT path FROM categories WHERE id = $4) || $1::uuid
        END
      RETURNING *;
    `;
      const { id, name, description, parentId } = data.toJSON();
      return this.categRepo.query<CategoryEntity>(sql, [id, name, description ?? null, parentId]);
    })
      .andThen((c) => CategoryMapper.toDomain(c))
      .mapErr(mapTypeOrmError);
  }
  updateDetails(id: string, data: { name?: string; description?: string | null }): DBResult<Category> {
    return Result.wrapAsync(async () => {
      const cat = await this.categRepo
        .createQueryBuilder()
        .update()
        .set(data)
        .where('id=:id', { id })
        .returning('*')
        .execute();

      const [row] = cat.raw as CategoryEntity[];

      if (!row) throw new RecordNotFoundError(`Update Category not found: ${id}`);

      return row;
    })
      .andThen((c) => CategoryMapper.toDomain(c))
      .mapErr(mapTypeOrmError);
  }
  move(id: string, newParentId: string | null): DBResult<Category> {
    return Result.wrapAsync(async () => {
      const [row] = await this.categRepo.manager.query<
        {
          category: CategoryEntity | null;
          status: MOVE_STATUS;
        }[]
      >(MOVE_CATEGORY_SQL, [id, newParentId]);

      if (!row) throw new UnknownDatabaseError('Database returned no results.');
      switch (row.status) {
        case 'CATEGORY_NOT_FOUND':
          throw new RecordNotFoundError(`${MOVE_STATUS_CODES.CATEGORY_NOT_FOUND}: ${id}`);
        case 'PARENT_NOT_FOUND':
          throw new RecordNotFoundError(`${MOVE_STATUS_CODES.PARENT_NOT_FOUND}: ${newParentId}`);
        case 'CYCLE_DETECTED':
          throw new ConflictError(MOVE_STATUS_CODES.CYCLE_DETECTED);
      }

      // At this point, status is 'OK' and category is guaranteed non-null
      return row.category!;
    })
      .andThen((c) => CategoryMapper.toDomain(c))
      .mapErr(mapTypeOrmError);
  }
  delete(id: string, withSubtree: boolean): DBResult<number> {
    return Result.wrapAsync(async () => {
      const [row] = await this.categRepo.manager.query<{ affected: number }[]>(DELETE_CATEGORY_SQL, [id, withSubtree]);

      if (!row || row.affected === 0) {
        throw new RecordNotFoundError(`Category not found: ${id}`);
      }

      return row.affected;
    }).mapErr(mapTypeOrmError);
  }
}
