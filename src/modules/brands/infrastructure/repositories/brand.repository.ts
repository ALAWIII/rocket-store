import { DBResult } from 'src/modules/shared/errors/error.types';
import { Brand } from '../../domain/brand';
type FindOptions = {
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
  abstract update(brand: Brand): Promise<DBResult<Brand>>;
  abstract delete(id: string): Promise<DBResult<number>>;
}
