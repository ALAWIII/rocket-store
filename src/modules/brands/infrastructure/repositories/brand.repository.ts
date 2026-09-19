import { DBResult } from 'src/modules/shared/errors/error.types';
import { Brand } from '../../domain/brand';
import { Image } from 'src/modules/images/domain/image';
import { BrandImage } from '../../domain/brand-image';

export type FindAllFilterOptions = {
  name?: string;
  page?: number;
  limit?: number;
};

export abstract class IBrandRepository {
  abstract findAll(options: FindAllFilterOptions): Promise<DBResult<Brand[]>>;
  abstract findById(id: string): Promise<DBResult<Brand>>;
  abstract findBanners(brandId: string): Promise<DBResult<Image[]>>;

  abstract create(brand: Brand): Promise<DBResult<Brand>>;
  abstract attachImages(brandImages: BrandImage[]): Promise<DBResult<Image[]>>;
  abstract rename(brandId: string, name: string): Promise<DBResult<Brand>>;
  abstract deleteMany(ids: string[]): Promise<DBResult<number>>;
  abstract detachImages(
    brandId: string,
    imageIds: string[],
  ): Promise<DBResult<number>>;
}
