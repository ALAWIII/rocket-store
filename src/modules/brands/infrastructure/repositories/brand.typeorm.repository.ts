import { InjectRepository } from '@nestjs/typeorm';
import { BrandEntity } from '../entities/brand.entity';
import { FindOptions, IBrandRepository } from './brand.repository';
import { Repository } from 'typeorm';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Brand } from '../../domain/brand';
import { BrandImagesEntity } from '../entities/brand-images.entity';
import { Err } from 'ts-results-es';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import {
  CorruptedPersistenceDataError,
  RecordNotFoundError,
  UnknownDatabaseError,
} from 'src/modules/shared/errors/database.error';
import { BrandImage } from '../../domain/brand-image';

type BrandWithImagesDb = {
  brand: BrandEntity;
  images?: BrandImagesEntity[];
};

export class BrandRepository implements IBrandRepository {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly brandRepo: Repository<BrandEntity>,
    @InjectRepository(BrandImagesEntity)
    private readonly brandImageRepo: Repository<BrandImagesEntity>,
  ) {}
  async create(brand: Brand): Promise<DBResult<Brand>> {
    try {
      const brandJson = brand.toJSON();
      const images = brandJson.images ?? [];

      const insertBrandQb = this.brandRepo
        .createQueryBuilder()
        .insert()
        .values({ id: brandJson.id, name: brandJson.name })
        .returning('*');

      // No images? Just insert the brand and skip the second CTE entirely.
      if (images.length === 0) {
        const result = await insertBrandQb.execute();
        const [brand] = result.raw as BrandEntity[];
        if (!brand) {
          return Err(
            new UnknownDatabaseError(
              `Brand ${brandJson.id} was inserted successfully but its row was not returned.`,
            ),
          );
        }
        return this.toDomain({ brand });
      }

      const insertImagesQb = this.brandImageRepo
        .createQueryBuilder()
        .insert()
        .values(images.map((img) => ({ ...img, brandId: brandJson.id })))
        .returning('*');

      const [brandSql, brandParams] = insertBrandQb.getQueryAndParameters() as [
        string,
        unknown[],
      ];
      const [imagesSqlRaw, imagesParams] =
        insertImagesQb.getQueryAndParameters() as [string, unknown[]];
      // Each query builder numbers its own $1, $2... independently.
      // Postgres needs one shared placeholder namespace for the combined statement,
      // so shift the second query's placeholders past the first's.
      const imagesSql = imagesSqlRaw.replace(
        /\$(\d+)/g,
        (_, n) => `$${Number(n) + brandParams.length}`,
      );

      const sql = `
        WITH inserted_brand AS (
          ${brandSql}
        ),
        inserted_images AS (
          ${imagesSql}
        )
        SELECT
          (SELECT row_to_json(b) FROM inserted_brand b) AS brand,
          (SELECT COALESCE(json_agg(i), '[]'::json) FROM inserted_images i) AS images
      `;
      const params: unknown[] = [...brandParams, ...imagesParams];

      const [brandAndImages] = await this.brandRepo.manager.query<
        BrandWithImagesDb[]
      >(sql, params);

      return this.toDomain(brandAndImages);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  findAll(options?: FindOptions): Promise<DBResult<Brand[]>> {}
  findById(id: string, options?: FindOptions): Promise<DBResult<Brand>> {}
  findByName(name: string, options?: FindOptions): Promise<DBResult<Brand>> {}

  async rename(brandId: string, name: string): Promise<DBResult<Brand>> {
    try {
      const result = await this.brandRepo
        .createQueryBuilder()
        .update()
        .set({ name })
        .where('id = :brandId', { brandId })
        .returning('*')
        .execute();

      const [brand] = result.raw as BrandEntity[];
      if (!brand) {
        return Err(
          new RecordNotFoundError(`Brand with id ${brandId} not found`),
        );
      }

      return this.toDomain({ brand });
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  delete(id: string): Promise<DBResult<number>> {}

  private toDomain(b: BrandWithImagesDb): DBResult<Brand> {
    const images = b.images?.map((bi) =>
      BrandImage.restore({
        id: bi.id,
        imageId: bi.imageId,
        imageRole: bi.imageRole,
        sortOrder: bi.sortOrder,
        createdAt: bi.createdAt,
        updatedAt: bi.updatedAt,
      }),
    );

    return Brand.restore({
      ...b.brand,
      images,
    }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(
          `Failed to construct brand from BrandEntity: ${e.message}`,
          e,
        ),
    );
  }
}
