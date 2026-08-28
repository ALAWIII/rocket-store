import { Injectable } from '@nestjs/common';
import { IImageRepository } from './image.repository';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Image } from '../../domain/image';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { Result } from '@allawiii/results-ts';
import { Repository } from 'typeorm';
import { ImageEntity } from '../entities/image.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CorruptedPersistenceDataError } from 'src/modules/shared/errors/database.error';

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
