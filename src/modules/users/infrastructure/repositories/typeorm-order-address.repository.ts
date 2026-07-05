import { Injectable } from '@nestjs/common';
import { IOrderAddressRepository } from './order-address.repository';
import { OrderAddress } from '../../domain/address';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderAddressEntity } from '../entities/address.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderAddressRepositroy implements IOrderAddressRepository {
  constructor(
    @InjectRepository(OrderAddressEntity)
    private readonly orderAddressRepo: Repository<OrderAddressEntity>,
  ) {}
  async findByOrderId(orderId: string): Promise<OrderAddress[]> {
    const ordAddresses = await this.orderAddressRepo.findBy({ orderId });
    return ordAddresses.map((oae) => this.toDomain(oae));
  }
  async save(oa: OrderAddress): Promise<OrderAddress> {
    const result = await this.orderAddressRepo
      .createQueryBuilder()
      .insert()
      .into(OrderAddressEntity)
      .values({ ...oa.toPrimitives() })
      .returning('*')
      .execute();
    const rows = result.raw as OrderAddressEntity[];
    const row = rows[0] ?? null;

    if (!row) {
      throw new Error('Failed to save order address');
    }

    return this.toDomain(row);
  }
  async findById(id: string): Promise<OrderAddress | null> {
    const result = await this.orderAddressRepo.findOneBy({ id });
    return result ? this.toDomain(result) : null;
  }
  toDomain(oae: OrderAddressEntity): OrderAddress {
    return OrderAddress.fromPrimitives({ ...oae });
  }
}
