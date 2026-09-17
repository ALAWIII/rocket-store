import { DBResult } from 'src/modules/shared/errors/error.types';
import { Image } from '../../domain/image';
import { ImageEntity } from '../entities/image.entity';
import { CorruptedPersistenceDataError } from 'src/modules/shared/errors/database.error';
import { Ok } from '@allawiii/results-ts';

export class ImageMapper {
  static toDomain(entity: ImageEntity): DBResult<Image> {
    return Image.restore({ ...entity }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(
          `Failed to construct image from ImageEntity: ${e.message}`,
          e,
        ),
    );
  }

  static toDomainList(entities: ImageEntity[]): DBResult<Image[]> {
    const images: Image[] = [];
    for (const entity of entities) {
      const result = ImageMapper.toDomain(entity);
      if (result.isErr()) {
        return result.map();
      }
      images.push(result.unwrap());
    }
    return Ok(images);
  }
}
