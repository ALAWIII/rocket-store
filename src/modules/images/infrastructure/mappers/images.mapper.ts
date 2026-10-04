import { Image } from '../../domain/image';
import { ImageEntity } from '../entities/image.entity';
import { CorruptedPersistenceDataError, DatabaseError } from 'src/modules/shared/errors/database.error';
import { Ok, Result } from '@allawiii/results-ts';

export class ImageMapper {
  static toDomain(entity: ImageEntity): Result<Image, DatabaseError> {
    return Image.restore({ ...entity }).mapErr(
      (e) => new CorruptedPersistenceDataError(`Failed to construct image from ImageEntity: ${e.message}`, e),
    );
  }

  static toDomainList(entities: ImageEntity[]): Result<Image[], DatabaseError> {
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
