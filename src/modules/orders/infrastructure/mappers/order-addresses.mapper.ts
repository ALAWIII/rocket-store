import { OrderAddress } from '../../domain/order-address';
import { OrderAddressEntity } from '../entities/order-address.entity';
import { CorruptedPersistenceDataError, DatabaseError } from 'src/modules/shared/errors/database.error';
import { Ok, Result } from '@allawiii/results-ts';

export class OrderAddressMapper {
  static toDomain(entity: OrderAddressEntity): Result<OrderAddress, DatabaseError> {
    return OrderAddress.fromPrimitives({ ...entity }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(`Failed to construct OrderAddress from OrderAddressEntity: ${e.message}`, e),
    );
  }

  static toDomainList(entities: OrderAddressEntity[]): Result<OrderAddress[], DatabaseError> {
    const orderAddresses: OrderAddress[] = [];
    for (const entity of entities) {
      const result = OrderAddressMapper.toDomain(entity);
      if (result.isErr()) {
        return result.map();
      }
      orderAddresses.push(result.unwrap());
    }
    return Ok(orderAddresses);
  }
}
