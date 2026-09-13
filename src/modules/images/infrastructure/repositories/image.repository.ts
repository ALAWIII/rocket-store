import { DBResult } from 'src/modules/shared/errors/error.types';
import { Image } from '../../domain/image';

export type Pagination = {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'sizeBytes' | 'createdAt';
};
export type FindUnUsedDbResponse = {
  images: Image[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};
export abstract class IImageRepository {
  abstract save(image: Image): Promise<DBResult<Image>>;
  abstract findById(imageId: string): Promise<DBResult<Image>>;
  abstract findUnUsed(
    options: Pagination,
  ): Promise<DBResult<FindUnUsedDbResponse>>;
  abstract deleteMany(imageIds: string[]): Promise<DBResult<number>>;
}
