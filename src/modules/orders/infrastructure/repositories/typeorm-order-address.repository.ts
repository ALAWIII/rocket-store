import { Injectable } from '@nestjs/common';
import { createOrderAddressData, IOrderAddressRepository } from './order-address.repository';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { RecordNotFoundError } from 'src/modules/shared/errors/database.error';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Result } from '@allawiii/results-ts';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { OrderEntity } from 'src/modules/orders/infrastructure/entities/order.entity';
import { OrderAddressEntity } from '../entities/order-address.entity';
import { OrderAddress } from '../../domain/order-address';
import { AddressEntity } from 'src/modules/users/infrastructure/entities/address.entity';
import { OrderAddressMapper } from '../mappers/order-addresses.mapper';

@Injectable()
export class OrderAddressRepositroy implements IOrderAddressRepository {
  constructor(
    @InjectRepository(OrderAddressEntity)
    private readonly orderAddressRepo: Repository<OrderAddressEntity>,
  ) {}
  findByOrderId(userId: string, orderId: string): DBResult<OrderAddress[]> {
    return Result.wrapAsync(() =>
      this.orderAddressRepo
        .createQueryBuilder('orderAddress')
        .innerJoin(OrderEntity, 'order', 'order.id = orderAddress.order_id')
        .where('orderAddress.order_id = :orderId', { orderId })
        .andWhere('order.user_id = :userId', { userId })
        .getMany(),
    )
      .andThen((entities) => OrderAddressMapper.toDomainList(entities))
      .mapErr(mapTypeOrmError);
  }
  create(userId: string, d: createOrderAddressData): DBResult<OrderAddress> {
    return Result.wrapAsync(async () => {
      const isAddressOwner = this.orderAddressRepo.manager
        .createQueryBuilder(OrderEntity, 'orders')
        .select('1')
        .where('orders.id = :orderId', { orderId: d.orderId })
        .andWhere('orders.user_id = :userId', { userId });

      const selectedFields = this.orderAddressRepo.manager
        .createQueryBuilder(AddressEntity, 'addresses')
        .select('addresses.full_name', 'full_name')
        .addSelect('addresses.phone', 'phone')
        .addSelect('addresses.country', 'country')
        .addSelect('addresses.city', 'city')
        .addSelect('addresses.state', 'state')
        .addSelect('addresses.postal_code', 'postal_code')
        .addSelect('addresses.address_line1', 'address_line1')
        .addSelect('addresses.address_line2', 'address_line2')
        .addSelect(':addressType', 'address_type')
        .addSelect(':orderId', 'order_id')
        .where('addresses.id = :adrsId', { adrsId: d.addressId })
        .andWhere('addresses.user_id= :userId', { userId })
        .andWhereExists(isAddressOwner)
        .setParameters({ addressType: d.addressType, orderId: d.orderId });

      const result = await this.orderAddressRepo
        .createQueryBuilder()
        .addCommonTableExpression(isAddressOwner, 'is_address_owner')
        .insert()
        .into(OrderAddressEntity, [
          'full_name',
          'phone',
          'country',
          'city',
          'state',
          'postal_code',
          'address_line1',
          'address_line2',
          'address_type',
          'order_id',
        ])
        .valuesFromSelect(selectedFields)
        .returning('*')
        .execute();

      const [row] = result.raw as OrderAddressEntity[];

      // ✅ CHANGED: throw instead of return Err()
      if (!row) {
        throw new RecordNotFoundError('Could not create order address: address or order not found');
      }

      return row;
    })
      .andThen((entity) => OrderAddressMapper.toDomain(entity))
      .mapErr(mapTypeOrmError);
  }
}
