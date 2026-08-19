import { DBResult } from 'src/modules/shared/errors/error.types';
import { Image } from '../../domain/image';

export type Pagination = {
  page?: number;
  limit?: number;
};

export abstract class IImageRepository {
  abstract save(image: Image): Promise<DBResult<Image>>;
  abstract findById(imageId: string): Promise<DBResult<Image>>;
  abstract findUnUsed(options: Pagination): Promise<DBResult<Image[]>>;
  abstract delete(imageId: string): Promise<DBResult<number>>;
  abstract deleteUnUsed(): Promise<DBResult<number>>;
}
