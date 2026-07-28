import { DBResult } from 'src/modules/shared/errors/error.types';
import { OrderAddress } from '../../domain/order-address';

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
}
