import { DBResult } from 'src/modules/shared/errors/error.types';
import { Category } from '../../domain/category';
import { ICategoryRepository } from './category.repository';
import { Result } from '@allawiii/results-ts';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryMapper } from '../mappers/category.mapper';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { RecordNotFoundError } from 'src/modules/shared/errors/database.error';

export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categRepo: Repository<CategoryEntity>,
  ) {}

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
}
