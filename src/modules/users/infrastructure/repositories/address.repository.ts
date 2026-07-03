import { Address } from '../../domain/address';

export abstract class IAddressRepository {
  abstract loadAll(): Promise<Address[]>;
  abstract upsert(adrs: Address): Promise<Address>;
  abstract findById(id: string): Promise<Address | null>;
  abstract remove(id: string): Promise<void>;
}
