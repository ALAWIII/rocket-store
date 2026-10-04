import { InjectRepository } from '@nestjs/typeorm';
import { BrandEntity } from '../entities/brand.entity';
import { IBrandRepository, FindAllFilterOptions } from './brand.repository';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Brand } from '../../domain/brand';
import { BrandImagesEntity } from '../entities/brand-images.entity';
import { Result } from '@allawiii/results-ts';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { RecordNotFoundError, UnknownDatabaseError } from 'src/modules/shared/errors/database.error';
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
  create(brand: Brand): DBResult<Brand> {
    return Result.wrapAsync(async () => {
      const result = await this.brandRepo
        .createQueryBuilder()
        .insert()
        .into(BrandEntity)
        .values(brand.toJSON())
        .returning('*')
        .execute();
      const [b] = result.raw as BrandEntity[];
      if (!b) throw new UnknownDatabaseError('Failed to return the newly created brand.');

      return b;
    })
      .andThen((b) => BrandMapper.toDomain(b))
      .mapErr(mapTypeOrmError);
  }
  attachImages(brandImages: BrandImage[]): DBResult<Image[]> {
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
        .where('images.id IN (SELECT "imageId" FROM image_ids)')
        .getMany();
      return images;
    })
      .andThen((imgs) => BrandMapper.toDomainBanners(imgs))
      .mapErr(mapTypeOrmError);
  }

  rename(brandId: string, name: string): DBResult<Brand> {
    return Result.wrapAsync(async () => {
      const result = await this.brandRepo
        .createQueryBuilder()
        .update()
        .set({ name })
        .where('id = :brandId', { brandId })
        .returning('*')
        .execute();

      const [brand] = result.raw as BrandEntity[];
      if (!brand) throw new RecordNotFoundError(`Brand with id ${brandId} not found`);

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
  deleteMany(ids: string[]): DBResult<number> {
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
  detachImages(brandId: string, imageIds: string[]): DBResult<number> {
    return Result.wrapAsync(async () =>
      this.brandImageRepo.delete({
        brandId,
        imageId: In(imageIds),
      }),
    )
      .map((res) => res.affected ?? 0)
      .mapErr(mapTypeOrmError);
  }

  findAll(options: FindAllFilterOptions = {}): DBResult<Brand[]> {
    const { limit, skip } = this.normalizePagination(options.page, options.limit);

    return Result.wrapAsync(async () => {
      // 1. CTE: Fetch Images + their brandId from the junction table
      const logoCte = this.brandImageRepo.manager
        .createQueryBuilder(ImageEntity, 'img')
        .innerJoin(BrandImagesEntity, 'bi', 'bi.imageId = img.id AND bi.imageRole = :role')

        .addSelect('bi.brandId', 'brandId'); // Expose brandId for the main query join

      // 2. Main Query: Join CTE to Brands
      const brandEntities = this.brandRepo
        .createQueryBuilder('brand')
        .addCommonTableExpression(logoCte, 'brand_logos')
        .setParameter('role', 'logo')
        .leftJoinAndMapOne(
          // is correct choice because every brand has at most one logo.
          'brand.logo',
          'brand_logos',
          'logo',
          'logo."brandId" = brand.id', // Join on the exposed brandId
        )
        .skip(skip)
        .take(limit);
      if (options.name) {
        brandEntities.andWhere('brand.name ILIKE :name', { name: `%${options.name}%` }).orderBy('brand.name', 'ASC'); // Alphabetical for search
      } else {
        brandEntities
          .orderBy('brand.createdAt', 'DESC') // Newest first for list
          .addOrderBy('brand.id', 'ASC');
      }
      return brandEntities.getMany();
    })
      .andThen((brands) => BrandMapper.toDomainList(brands))
      .mapErr(mapTypeOrmError);
  }
  findById(id: string): DBResult<Brand> {
    return (
      Result.wrapAsync(async () => {
        const brand = await this.brandRepo
          .createQueryBuilder('brand')
          // 1. Join the junction table
          .leftJoin(BrandImagesEntity, 'bi', 'bi.brandId = brand.id AND bi.imageRole = :role', { role: 'logo' })
          // 2. Map the actual ImageEntity to 'brand.logo'
          .leftJoinAndMapOne('brand.logo', ImageEntity, 'img', 'img.id = bi.imageId')
          .where('brand.id = :id', { id })
          .getOneOrFail();

        return brand;
      })
        // Cast to BrandWithLogo because TS doesn't know about the dynamic 'logo' property
        .andThen((brand) => BrandMapper.toDomain(brand))
        .mapErr(mapTypeOrmError)
    );
  }

  findBanners(brandId: string): DBResult<Image[]> {
    return this.findImagesByRole(brandId, 'banner').andThen((images) => BrandMapper.toDomainBanners(images));
  }

  // ============= helper methods ====
  private normalizePagination(page?: number, limit?: number): Pagination {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.max(1, limit ?? 100);

    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
    };
  }

  // Execution wrapper
  private findImagesByRole(brandId: string, role: 'logo' | 'banner'): DBResult<ImageEntity[]> {
    return Result.wrapAsync(() => this.getImagesByRoleQb(brandId, role).getMany()).mapErr(mapTypeOrmError);
  }
  // Helper to build the query (composable)
  private getImagesByRoleQb(
    brandId: string,
    role: 'logo' | 'banner',
    qb?: SelectQueryBuilder<ImageEntity>,
  ): SelectQueryBuilder<ImageEntity> {
    const baseQb = qb ?? this.brandImageRepo.manager.createQueryBuilder(ImageEntity, 'image');

    return baseQb
      .innerJoin(BrandImagesEntity, 'bi', 'bi.imageId = image.id')
      .where('bi.brandId = :brandId', { brandId })
      .andWhere('bi.imageRole = :role', { role })
      .select('image');
  }
}
