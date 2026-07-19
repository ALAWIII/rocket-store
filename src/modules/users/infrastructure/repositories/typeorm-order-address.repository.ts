import { Injectable } from '@nestjs/common';
import { IOrderAddressRepository } from './order-address.repository';
import { OrderAddress } from '../../domain/address';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderAddressEntity } from '../entities/address.entity';
import { Repository } from 'typeorm';
import {
  CorruptedPersistenceDataError,
  UnknownDatabaseError,
} from 'src/modules/shared/errors/database.error';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Err, None, Ok, Option, Some } from 'ts-results-es';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';

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
  async save(oa: OrderAddress): Promise<DBResult<OrderAddress>> {
    try {
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
        throw new UnknownDatabaseError(
          'Failed to obtain the order address entity after insertion.',
        );
      }

      return Ok(this.toDomain(row));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findById(id: string): Promise<DBResult<Option<OrderAddress>>> {
    try {
      const result = await this.orderAddressRepo.findOneBy({ id });
      return Ok(result ? Some(this.toDomain(result)) : None);
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
