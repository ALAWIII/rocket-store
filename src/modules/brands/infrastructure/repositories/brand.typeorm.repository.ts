import { InjectRepository } from '@nestjs/typeorm';
import { BrandEntity } from '../entities/brand.entity';
import { IBrandRepository, PaginationOptions } from './brand.repository';
import { In, Repository } from 'typeorm';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Brand } from '../../domain/brand';
import { BrandImagesEntity } from '../entities/brand-images.entity';
import { Err, Ok } from 'ts-results-es';
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
type Pagination = {
  page: number;
  limit: number;
  skip: number;
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
  async findAll(options: PaginationOptions = {}): Promise<DBResult<Brand[]>> {
    try {
      const { limit, skip, page } = this.normalizePagination(
        options.page,
        options.limit,
      );

      const logoCte = this.brandImageRepo
        .createQueryBuilder()
        .select('*')
        .from('brand_images', 'bi')
        .where('"imageRole" = :role', { role: 'logo' });

      const brandEntities: (BrandEntity & { logo?: BrandImagesEntity })[] =
        await this.brandRepo
          .createQueryBuilder('brand')
          .addCommonTableExpression(logoCte, 'brand_logos')
          .leftJoinAndMapOne(
            'brand.logo', // property to attach on the entity
            'brand_logos',
            'logo',
            'logo."brandId" = brand.id',
          )
          .orderBy('brand."createdAt"', 'DESC')
          .addOrderBy('brand.id', 'ASC')
          .skip(skip)
          .take(limit)
          .getMany();

      const domainBrands: Brand[] = [];
      for (const b of brandEntities) {
        const dbrand = this.toDomain({
          brand: b,
          images: b.logo ? [b.logo] : undefined,
        });
        if (dbrand.isErr()) {
          return dbrand;
        }
        domainBrands.push(dbrand.unwrap());
      }

      return Ok(domainBrands);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findById(id: string): Promise<DBResult<Brand>> {
    try {
      const brand: BrandEntity & { logo?: BrandImagesEntity } =
        await this.brandRepo
          .createQueryBuilder('brand')
          .leftJoinAndMapOne(
            'brand.logo',
            'brand_images',
            'logo',
            'logo."brandId" = brand.id AND logo."imageRole" = :role',
            { role: 'logo' },
          )
          .where('brand.id = :id', { id })
          .getOneOrFail();

      return this.toDomain({
        brand,
        images: brand.logo ? [brand.logo] : undefined,
      });
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  findByName(
    names: string,
    options: PaginationOptions,
  ): Promise<DBResult<Brand>> {}
  findBanners(brandId: string): Promise<DBResult<BrandImage[]>> {}
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
  async updateImageSortOrderBatch(
    brandId: string,
    updates: { brandImageId: string; sortOrder: number }[],
  ): Promise<DBResult<string[]>> {
    try {
      // generating numbers placeholders: (e.g ($1, $2),($3, $4), ...)
      const valuesSql = updates
        .map((_, i) => `($${i * 2 + 1}::uuid, $${i * 2 + 2}::int)`)
        .join(', ');
      const updateParams: unknown[] = updates.flatMap((u) => [
        u.brandImageId,
        u.sortOrder,
      ]);
      const brandIdParamIdx = updateParams.length + 1;

      const sql = `
        UPDATE brand_images
        SET "sortOrder" = data."sortOrder", "updatedAt" = NOW()
        FROM (VALUES ${valuesSql}) AS data(id, "sortOrder")
        WHERE brand_images."id" = data.id
          AND brand_images."brandId" = $${brandIdParamIdx}
        RETURNING brand_images."id"
      `;

      const params = [...updateParams, brandId];

      const rows = await this.brandImageRepo.manager.query<{ id: string }[]>(
        sql,
        params,
      );

      return Ok(rows.map((r) => r.id));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async delete(id: string): Promise<DBResult<number>> {
    try {
      const result = await this.brandRepo.delete({ id });

      return Ok(result.affected ?? 0);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }

  async deleteImages(
    brandId: string,
    imageIds: string[],
  ): Promise<DBResult<number>> {
    try {
      const result = await this.brandImageRepo.delete({
        brandId,
        id: In(imageIds),
      });

      return Ok(result.affected ?? 0);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }

  private normalizePagination(page?: number, limit?: number): Pagination {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.max(1, Math.min(100, limit ?? 20));

    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
    };
  }
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
      id: b.brand.id,
      name: b.brand.name,
      createdAt: b.brand.createdAt,
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
