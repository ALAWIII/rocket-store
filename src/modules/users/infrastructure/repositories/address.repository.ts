import { DBResult } from 'src/modules/shared/errors/error.types';
import { Address } from '../../domain/address';

export abstract class IAddressRepository {
  abstract findAll(userId: string): DBResult<Address[]>;
  abstract create(adrs: Address): DBResult<Address>;
  abstract update(adrs: Address): DBResult<Address>;
  abstract findById(userId: string, id: string): DBResult<Address>;
  abstract delete(d: { id: string; userId: string }): DBResult<number>;
}
