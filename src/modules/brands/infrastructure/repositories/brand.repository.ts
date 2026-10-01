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
  abstract findAll(options: FindAllFilterOptions): DBResult<Brand[]>;
  abstract findById(id: string): DBResult<Brand>;
  abstract findBanners(brandId: string): DBResult<Image[]>;

  abstract create(brand: Brand): DBResult<Brand>;
  abstract attachImages(brandImages: BrandImage[]): DBResult<Image[]>;
  abstract rename(brandId: string, name: string): DBResult<Brand>;
  abstract deleteMany(ids: string[]): DBResult<number>;
  abstract detachImages(brandId: string, imageIds: string[]): DBResult<number>;
}
