import { DBResult } from 'src/modules/shared/errors/error.types';
import { Address } from '../../domain/address';
import { Option } from 'ts-results-es';

export abstract class IAddressRepository {
  abstract findAll(d: { userId: string }): Promise<DBResult<Address[]>>;
  abstract upsert(adrs: Address): Promise<DBResult<Address>>;
  abstract findById(id: string): Promise<DBResult<Option<Address>>>;
  abstract delete(id: string): Promise<DBResult<number>>;
}
