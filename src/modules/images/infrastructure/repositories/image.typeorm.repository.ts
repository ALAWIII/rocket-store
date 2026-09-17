import { Injectable } from '@nestjs/common';
import {
  FindUnUsedDbResponse,
  IImageRepository,
  Pagination,
} from './image.repository';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Image } from '../../domain/image';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { Result } from '@allawiii/results-ts';
import {
  DeleteQueryBuilder,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { ImageEntity } from '../entities/image.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IMAGE_FK_COLUMN,
  IMAGE_USAGE_TABLES,
} from 'src/modules/shared/domain/image-usage-table';
import { ImageMapper } from '../mappers/images.mapper';

@Injectable()
export class ImageRepository implements IImageRepository {
  constructor(
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
  ) {}
  async save(image: Image): Promise<DBResult<Image>> {
    return await Result.wrapAsync(async () => {
      const imageJson = image.toJSON();
      const entity = await this.imageRepo.save(
        this.imageRepo.create(imageJson),
      );
      return entity;
    })
      .mapErr(mapTypeOrmError)
      .andThen((entity) => ImageMapper.toDomain(entity));
  }
  async findById(imageId: string): Promise<DBResult<Image>> {
    return await Result.wrapAsync(async () =>
      this.imageRepo.findOneByOrFail({ id: imageId }),
    )
      .mapErr(mapTypeOrmError)
      .andThen((img) => ImageMapper.toDomain(img));
  }
  async deleteMany(imageIds: string[]): Promise<DBResult<number>> {
    return await Result.wrapAsync(() =>
      this.imageRepo.delete({ id: In(imageIds) }),
    )
      .map((v) => v.affected ?? 0)
      .mapErr(mapTypeOrmError);
  }
  async findUnUsed(
    options: Pagination,
  ): Promise<DBResult<FindUnUsedDbResponse>> {
    const { page = 1, limit = 20, sortBy = 'createdAt' } = options;
    return await Result.wrapAsync(async () => {
      const qb = this.imageRepo
        .createQueryBuilder('image')
        .orderBy(sortBy)
        .skip((page - 1) * limit)
        .take(limit);

      this.applyUnusedImageFilter(qb);

      const [images, total] = await qb.getManyAndCount();

      return { images, total };
    })
      .mapErr(mapTypeOrmError)
      .andThen(({ images: imgs, total }) => {
        return ImageMapper.toDomainList(imgs).map((images) => {
          return {
            images,
            pagination: {
              page,
              limit,
              total,
            },
          };
        });
      });
  }

  private applyUnusedImageFilter(
    qb: SelectQueryBuilder<any> | DeleteQueryBuilder<any>,
    mainAlias = 'image',
  ): typeof qb {
    IMAGE_USAGE_TABLES.forEach((table, idx) => {
      const alias = `usage_${idx}`;
      qb.andWhere(
        `NOT EXISTS (SELECT 1 FROM "${table}" AS "${alias}" WHERE "${alias}"."${IMAGE_FK_COLUMN}" = "${mainAlias}"."id")`,
      );
    });
    return qb;
  }
}
