import { Injectable } from '@nestjs/common';
import {
  FindUnUsedDbResponse,
  IImageRepository,
  Pagination,
} from './image.repository';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Image } from '../../domain/image';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { Ok, Result } from '@allawiii/results-ts';
import { Repository } from 'typeorm';
import { ImageEntity } from '../entities/image.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CorruptedPersistenceDataError } from 'src/modules/shared/errors/database.error';
import {
  IMAGE_FK_COLUMN,
  IMAGE_USAGE_TABLES,
} from 'src/modules/shared/domain/image-usage-table';

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
      .andThen((entity) => this.toDomain(entity));
  }
  async findById(imageId: string): Promise<DBResult<Image>> {
    return await Result.wrapAsync(async () =>
      this.imageRepo.findOneByOrFail({ id: imageId }),
    )
      .mapErr(mapTypeOrmError)
      .andThen((img) => this.toDomain(img));
  }
  async delete(imageId: string): Promise<DBResult<number>> {
    return await Result.wrapAsync(() => this.imageRepo.delete({ id: imageId }))
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

      const imageCol = IMAGE_FK_COLUMN;
      IMAGE_USAGE_TABLES.forEach((table, idx) => {
        const alias = `usage_${idx}`;
        qb.andWhere(
          `NOT EXISTS (SELECT 1 FROM "${table}" AS "${alias}" WHERE "${alias}"."${imageCol}" = "image"."id")`,
        );
      });
      const [images, total] = await qb.getManyAndCount();

      return { images, total };
    })
      .mapErr(mapTypeOrmError)
      .andThen(({ images: imgs, total }) => {
        return this.imagesToDomain(imgs).map((images) => {
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
  private imagesToDomain(imgs: ImageEntity[]): DBResult<Image[]> {
    const images: Image[] = [];
    for (const img of imgs) {
      const dImg = this.toDomain(img);
      if (dImg.isErr()) {
        return dImg.map();
      }
      images.push(dImg.unwrap());
    }
    return Ok(images);
  }
  private toDomain(img: ImageEntity) {
    return Image.restore({ ...img }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(
          `Failed to construct image from ImageEntity: ${e.message}`,
          e,
        ),
    );
  }
}
