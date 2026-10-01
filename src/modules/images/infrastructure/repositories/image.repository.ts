import { DBResult } from 'src/modules/shared/errors/error.types';
import { Image } from '../../domain/image';
export type ImageSortByOptions = 'name' | 'sizeBytes' | 'createdAt';
export type Pagination = {
  page?: number;
  limit?: number;
  sortBy?: ImageSortByOptions;
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
  abstract save(image: Image): DBResult<Image>;
  abstract findById(imageId: string): DBResult<Image>;
  abstract findUnused(options: Pagination): DBResult<FindUnUsedDbResponse>;
  abstract deleteMany(imageIds: string[]): DBResult<number>;
}
