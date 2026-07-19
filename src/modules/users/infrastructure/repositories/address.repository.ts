import { DBResult } from 'src/modules/shared/errors/error.types';
import { Address } from '../../domain/address';
import { Option } from 'ts-results-es';

export abstract class IAddressRepository {
  abstract loadAll(): Promise<DBResult<Address[]>>;
  abstract upsert(adrs: Address): Promise<DBResult<Address>>;
  abstract findById(id: string): Promise<DBResult<Option<Address>>>;
  abstract remove(id: string): Promise<DBResult<number>>;
}
