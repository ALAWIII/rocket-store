import { DBResult } from 'src/modules/shared/errors/error.types';
import { OrderAddress } from '../../domain/address';
import { Option } from 'ts-results-es';

export abstract class IOrderAddressRepository {
  abstract findByOrderId(orderId: string): Promise<DBResult<OrderAddress[]>>;
  abstract save(adrs: OrderAddress): Promise<DBResult<OrderAddress>>;
  abstract findById(id: string): Promise<DBResult<Option<OrderAddress>>>;
}
