import { DBResult } from 'src/modules/shared/errors/error.types';
import { Brand } from '../../domain/brand';
import { BrandImage } from '../../domain/brand-image';

export type PaginationOptions = { page?: number; limit?: number };

export abstract class IBrandRepository {
  abstract findAll(options: PaginationOptions): Promise<DBResult<Brand[]>>;
  abstract findById(id: string): Promise<DBResult<Brand>>;
  abstract findByNames(
    names: string[],
    options: PaginationOptions,
  ): Promise<DBResult<Brand[]>>;
  abstract findBanners(brandId: string): Promise<DBResult<BrandImage[]>>;
  abstract updateImageSortOrderBatch(
    brandId: string,
    updates: { brandImageId: string; sortOrder: number }[],
  ): Promise<DBResult<string[]>>;
  abstract create(brand: Brand): Promise<DBResult<Brand>>;
  abstract rename(brandId: string, name: string): Promise<DBResult<Brand>>;
  abstract delete(id: string): Promise<DBResult<number>>;
  abstract deleteImages(
    brandId: string,
    imageIds: string[],
  ): Promise<DBResult<number>>;
}
