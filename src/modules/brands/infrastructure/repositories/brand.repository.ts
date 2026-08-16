import { DBResult } from 'src/modules/shared/errors/error.types';
import { Brand } from '../../domain/brand';
export type FindOptions = {
  includeLogo?: boolean;
  includeBanners?: boolean;
  page?: number;
  limit?: number;
};
export abstract class IBrandRepository {
  abstract findAll(options?: FindOptions): Promise<DBResult<Brand[]>>;
  abstract findById(
    id: string,
    options?: FindOptions,
  ): Promise<DBResult<Brand>>;
  abstract findByName(
    name: string,
    options?: FindOptions,
  ): Promise<DBResult<Brand>>;

  abstract create(brand: Brand): Promise<DBResult<Brand>>;
  abstract rename(brandId: string, name: string): Promise<DBResult<Brand>>;
  abstract delete(id: string): Promise<DBResult<number>>;
}
