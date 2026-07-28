import { Injectable } from '@nestjs/common';
import {
  createOrderAddressData,
  IOrderAddressRepository,
} from './order-address.repository';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import {
  CorruptedPersistenceDataError,
  UnknownDatabaseError,
} from 'src/modules/shared/errors/database.error';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Err, Ok } from 'ts-results-es';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { OrderEntity } from 'src/modules/orders/infrastructure/entities/order.entity';
import { OrderAddressEntity } from '../entities/order-address.entity';
import { OrderAddress } from '../../domain/order-address';
import { AddressEntity } from 'src/modules/users/infrastructure/entities/address.entity';

@Injectable()
export class OrderAddressRepositroy implements IOrderAddressRepository {
  constructor(
    @InjectRepository(OrderAddressEntity)
    private readonly orderAddressRepo: Repository<OrderAddressEntity>,
  ) {}
  async findByOrderId(orderId: string): Promise<DBResult<OrderAddress[]>> {
    try {
      const ordAddresses = await this.orderAddressRepo.findBy({ orderId });
      return Ok(ordAddresses.map((oae) => this.toDomain(oae)));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async create(
    userId: string,
    d: createOrderAddressData,
  ): Promise<DBResult<OrderAddress>> {
    try {
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

      const rows = result.raw as OrderAddressEntity[];
      const row = rows[0] ?? null;

      if (!row) {
        throw new UnknownDatabaseError(
          'Failed to obtain the order address entity after insertion.',
        );
      }

      return Ok(this.toDomain(row));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }

  private toDomain(oae: OrderAddressEntity): OrderAddress {
    return OrderAddress.fromPrimitives({ ...oae })
      .mapErr(
        (e) =>
          new CorruptedPersistenceDataError(
            `Failed to construct order address from OrderAddressEntity.`,
            e,
          ),
      )
      .unwrap();
  }
}
