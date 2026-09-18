import { InjectRepository } from '@nestjs/typeorm';
import { BrandEntity } from '../entities/brand.entity';
import { IBrandRepository, PaginationOptions } from './brand.repository';
import { ILike, In, Repository, SelectQueryBuilder } from 'typeorm';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Brand } from '../../domain/brand';
import { BrandImagesEntity } from '../entities/brand-images.entity';
import { Result } from '@allawiii/results-ts';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import {
  RecordNotFoundError,
  UnknownDatabaseError,
} from 'src/modules/shared/errors/database.error';
import { BrandImage } from '../../domain/brand-image';
import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import { Image } from 'src/modules/images/domain/image';
import { BrandMapper } from '../mappers/brand.mapper';

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
    return Result.wrapAsync(async () => {
      const result = await this.brandRepo
        .createQueryBuilder()
        .insert()
        .into(BrandEntity)
        .values(brand.toJSON())
        .returning('*')
        .execute();
      const [b] = result.raw as BrandEntity[];
      if (!b)
        throw new UnknownDatabaseError(
          'Failed to return the newly created brand.',
        );

      return b;
    })
      .andThen((b) => BrandMapper.toDomain(b))
      .mapErr(mapTypeOrmError);
  }
  async attachImages(brandImages: BrandImage[]): Promise<DBResult<Image[]>> {
    return Result.wrapAsync(async () => {
      const brandImagesList = brandImages.map((img) => img.toJSON());
      const insertCte = this.brandImageRepo
        .createQueryBuilder()
        .insert()
        .into(BrandImagesEntity)
        .values(brandImagesList)
        .returning('"imageId"');
      const images = await this.brandImageRepo.manager
        .createQueryBuilder(ImageEntity, 'images')
        .addCommonTableExpression(insertCte, 'image_ids')
        .select('*')
        .where('images.id IN (SELECT "imageId" FROM image_ids)')
        .getMany();
      return images;
    })
      .andThen((imgs) => BrandMapper.toDomainBanners(imgs))
      .mapErr(mapTypeOrmError);
  }

  async rename(brandId: string, name: string): Promise<DBResult<Brand>> {
    return Result.wrapAsync(async () => {
      const result = await this.brandRepo
        .createQueryBuilder()
        .update()
        .set({ name })
        .where('id = :brandId', { brandId })
        .returning('*')
        .execute();

      const [brand] = result.raw as BrandEntity[];
      if (!brand)
        throw new RecordNotFoundError(`Brand with id ${brandId} not found`);

      return brand;
    })
      .andThen((brand) => BrandMapper.toDomain(brand))
      .mapErr(mapTypeOrmError);
  }

  /**
   * only for deleting brands
   * @param ids
   * @returns number of affected rows
   */
  async deleteMany(ids: string[]): Promise<DBResult<number>> {
    return Result.wrapAsync(() => this.brandRepo.delete({ id: In(ids) }))
      .map((res) => res.affected ?? 0)
      .mapErr(mapTypeOrmError);
  }

  /**
   * used to unlink a batch of images from a given brand
   * @param brandId
   * @param imageIds
   * @returns number of affected rows
   */
  async detachImages(
    brandId: string,
    imageIds: string[],
  ): Promise<DBResult<number>> {
    return Result.wrapAsync(async () =>
      this.brandImageRepo.delete({
        brandId,
        id: In(imageIds),
      }),
    )
      .map((res) => res.affected ?? 0)
      .mapErr(mapTypeOrmError);
  }
  async findByName(name: string): Promise<DBResult<Brand[]>> {
    return Result.wrapAsync(() =>
      this.brandRepo.findBy({ name: ILike(`%${name}%`) }),
    )
      .andThen((b) => BrandMapper.toDomainList(b))
      .mapErr(mapTypeOrmError);
  }
  async findAll(options: PaginationOptions = {}): Promise<DBResult<Brand[]>> {
    const { limit, skip } = this.normalizePagination(
      options.page,
      options.limit,
    );

    return Result.wrapAsync(async () => {
      // 1. CTE: Fetch Images + their brandId from the junction table
      const logoCte = this.brandImageRepo.manager
        .createQueryBuilder(ImageEntity, 'img')
        .innerJoin(
          BrandImagesEntity,
          'bi',
          'bi.imageId = img.id AND bi.imageRole = :role',
          { role: 'logo' },
        )
        .addSelect('bi.brandId', 'brandId'); // Expose brandId for the main query join

      // 2. Main Query: Join CTE to Brands
      const brandEntities = await this.brandRepo
        .createQueryBuilder('brand')
        .addCommonTableExpression(logoCte, 'brand_logos')
        .leftJoinAndMapOne(
          // is correct choice because every brand has at most one logo.
          'brand.logo',
          'brand_logos',
          'logo',
          'logo.brandId = brand.id', // Join on the exposed brandId
        )
        .orderBy('brand."createdAt"', 'DESC')
        .addOrderBy('brand.id', 'ASC')
        .skip(skip)
        .take(limit)
        .getMany();

      return brandEntities;
    })
      .andThen((brands) => BrandMapper.toDomainList(brands))
      .mapErr(mapTypeOrmError);
  }
  async findById(id: string): Promise<DBResult<Brand>> {
    return (
      Result.wrapAsync(async () => {
        const brand = await this.brandRepo
          .createQueryBuilder('brand')
          // 1. Join the junction table
          .leftJoin(
            BrandImagesEntity,
            'bi',
            'bi.brandId = brand.id AND bi.imageRole = :role',
            { role: 'logo' },
          )
          // 2. Map the actual ImageEntity to 'brand.logo'
          .leftJoinAndMapOne(
            'brand.logo',
            ImageEntity,
            'img',
            'img.id = bi.imageId',
          )
          .where('brand.id = :id', { id })
          .getOneOrFail();

        return brand;
      })
        // Cast to BrandWithLogo because TS doesn't know about the dynamic 'logo' property
        .andThen((brand) => BrandMapper.toDomain(brand))
        .mapErr(mapTypeOrmError)
    );
  }

  async findBanners(brandId: string): Promise<DBResult<Image[]>> {
    return (await this.findImagesByRole(brandId, 'banner')).andThen((images) =>
      BrandMapper.toDomainBanners(images),
    );
  }

  // ============= helper methods ====
  private normalizePagination(page?: number, limit?: number): Pagination {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.max(1, Math.min(100, limit ?? 20));

    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
    };
  }

  // Execution wrapper
  private async findImagesByRole(
    brandId: string,
    role: 'logo' | 'banner',
  ): Promise<DBResult<ImageEntity[]>> {
    return Result.wrapAsync(() =>
      this.getImagesByRoleQb(brandId, role).getMany(),
    ).mapErr(mapTypeOrmError);
  }
  // Helper to build the query (composable)
  private getImagesByRoleQb(
    brandId: string,
    role: 'logo' | 'banner',
    qb?: SelectQueryBuilder<ImageEntity>,
  ): SelectQueryBuilder<ImageEntity> {
    const baseQb =
      qb ??
      this.brandImageRepo.manager.createQueryBuilder(ImageEntity, 'image');

    return baseQb
      .innerJoin(BrandImagesEntity, 'bi', 'bi.imageId = image.id')
      .where('bi.brandId = :brandId', { brandId })
      .andWhere('bi.imageRole = :role', { role })
      .select('image');
  }
}
