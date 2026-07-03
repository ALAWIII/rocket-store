import { OrderAddress } from '../../domain/address';

export abstract class IOrderAddressRepository {
  abstract findByOrderId(orderId: string): Promise<OrderAddress[]>;
  abstract save(adrs: OrderAddress): Promise<OrderAddress>;
  abstract findById(id: string): Promise<OrderAddress | null>;
}
