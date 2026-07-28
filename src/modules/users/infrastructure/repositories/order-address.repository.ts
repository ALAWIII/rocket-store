import { DBResult } from 'src/modules/shared/errors/error.types';
import { OrderAddress } from '../../domain/address';
import { Option } from 'ts-results-es';

export type createOrderAddressData = {
  addressId: string;
  orderId: string;
  addressType: 'billing' | 'shipping';
};

export abstract class IOrderAddressRepository {
  abstract findByOrderId(orderId: string): Promise<DBResult<OrderAddress[]>>;
  abstract create(
    userId: string,
    adrs: createOrderAddressData,
  ): Promise<DBResult<OrderAddress>>;
  abstract findById(id: string): Promise<DBResult<Option<OrderAddress>>>;
}
