import { Address } from '../../domain/address';
import { AddressEntity } from '../entities/address.entity';
import { CorruptedPersistenceDataError, DatabaseError } from 'src/modules/shared/errors/database.error';
import { Ok, Result } from '@allawiii/results-ts';

export class AddressMapper {
  static toDomain(entity: AddressEntity): Result<Address, DatabaseError> {
    return Address.fromPrimitives({ ...entity }).mapErr(
      (e) => new CorruptedPersistenceDataError(`Failed to construct Address from AddressEntity: ${e.message}`, e),
    );
  }

  static toDomainList(entities: AddressEntity[]): Result<Address[], DatabaseError> {
    const addresses: Address[] = [];
    for (const entity of entities) {
      const result = AddressMapper.toDomain(entity);
      if (result.isErr()) {
        return result.map();
      }
      addresses.push(result.unwrap());
    }
    return Ok(addresses);
  }
}
