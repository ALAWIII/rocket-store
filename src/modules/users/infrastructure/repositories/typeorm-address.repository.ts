import { Injectable } from '@nestjs/common';
import { Address } from '../../domain/address';
import { IAddressRepository } from './address.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AddressEntity } from '../entities/address.entity';
import { IsNull, Repository } from 'typeorm';
import {
  CorruptedPersistenceDataError,
  RecordNotFoundError,
  UnknownDatabaseError,
} from 'src/modules/shared/errors/database.error';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Err, None, Ok, Option, Some } from 'ts-results-es';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';

@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(
    @InjectRepository(AddressEntity)
    private readonly addressRepo: Repository<AddressEntity>,
  ) {}
  async findAll(userId: string): Promise<DBResult<Address[]>> {
    try {
      const addresses = await this.addressRepo.findBy({ userId });
      return Ok(addresses.map((adrs) => this.toDomain(adrs)));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findById(id: string): Promise<DBResult<Option<Address>>> {
    try {
      const result = await this.addressRepo.findOneBy({
        id,
        deletedAt: IsNull(),
      });
      return Ok(result ? Some(this.toDomain(result)) : None);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async delete(d: { id: string; userId: string }): Promise<DBResult<number>> {
    try {
      return Ok(
        (await this.addressRepo.softDelete({ id: d.id, userId: d.userId }))
          .affected ?? 0,
      );
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async update(adrs: Address): Promise<DBResult<Address>> {
    try {
      const { id, userId, createdAt, updatedAt, deletedAt, ...values } =
        adrs.toPrimitives();

      const result = await this.addressRepo
        .createQueryBuilder()
        .update(AddressEntity)
        .set(values)
        .where('id = :id', { id })
        .andWhere('user_id = :userId', { userId })
        .andWhere('deleted_at IS NULL')
        .returning('*')
        .execute();

      const rows = result.raw as AddressEntity[];
      const row = rows[0] ?? null;
      if (!row) {
        return Err(
          new UnknownDatabaseError(
            'Address update succeeded but no row was returned.',
          ),
        );
      }

      return Ok(this.toDomain(row));
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  private toDomain(adrs: AddressEntity): Address {
    return Address.fromPrimitives({ ...adrs })
      .mapErr(
        (e) =>
          new CorruptedPersistenceDataError(
            `Failed to construct address from AddressEntity.`,
            e,
          ),
      )
      .unwrap();
  }
}
