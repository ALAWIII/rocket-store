import { Injectable } from '@nestjs/common';
import { Address } from '../../domain/address';
import { IAddressRepository } from './address.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AddressEntity } from '../entities/address.entity';
import { IsNull, Repository } from 'typeorm';
import {
  CorruptedPersistenceDataError,
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
  async loadAll(): Promise<DBResult<Address[]>> {
    try {
      const addresses = await this.addressRepo.find();
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
  async remove(id: string): Promise<DBResult<number>> {
    try {
      return Ok((await this.addressRepo.softDelete({ id })).affected ?? 0);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async upsert(adrs: Address): Promise<DBResult<Address>> {
    try {
      const { createdAt, updatedAt, ...values } = adrs.toPrimitives();

      const result = await this.addressRepo
        .createQueryBuilder()
        .insert()
        .into(AddressEntity)
        .values({
          ...values,
        })
        .orUpdate(
          [
            'fullName',
            'phone',
            'country',
            'city',
            'state',
            'postalCode',
            'addressLine1',
            'addressLine2',
            'deletedAt',
          ],
          ['id'],
          { skipUpdateIfNoValuesChanged: true },
        )
        .returning('*')
        .execute();

      const rows = result.raw as AddressEntity[];
      const row = rows[0] ?? null;

      if (!row) {
        throw new UnknownDatabaseError(
          'Failed to upsert address, the address entity should be returned by success upsert operation.',
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
