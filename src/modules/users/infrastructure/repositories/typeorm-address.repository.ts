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
  async findAll(userId: string): Promise<DBResult<Address[]>> {
    try {
      const addresses = await this.addressRepo.findBy({ userId });
      const domain: Address[] = [];
      for (const adrs of addresses) {
        const result = this.toDomain(adrs);
        if (result.isErr()) return result;
        domain.push(result.unwrap());
      }
      return Ok(domain);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async findById(
    userId: string,
    id: string,
  ): Promise<DBResult<Option<Address>>> {
    try {
      const result = await this.addressRepo.findOneBy({
        id,
        userId,
        deletedAt: IsNull(),
      });
      return result ? this.toDomain(result).map((a) => Some(a)) : Ok(None);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  async create(adrs: Address): Promise<DBResult<Address>> {
    try {
      const { createdAt, updatedAt, deletedAt, ...values } = adrs.toJSON();

      const entity = this.addressRepo.create(values);
      const saved = await this.addressRepo.save(entity);

      return this.toDomain(saved);
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
        adrs.toJSON();

      const result = await this.addressRepo
        .createQueryBuilder()
        .update(AddressEntity)
        .set(values)
        .where('id = :id', { id })
        .andWhere('userId = :userId', { userId })
        .andWhere('deletedAt IS NULL')
        .returning('*')
        .execute();

      const [address] = result.raw as AddressEntity[];
      if (!address) {
        return Err(
          new UnknownDatabaseError(
            'Address update succeeded but no row was returned.',
          ),
        );
      }

      return this.toDomain(address);
    } catch (e) {
      return Err(mapTypeOrmError(e));
    }
  }
  private toDomain(adrs: AddressEntity): DBResult<Address> {
    return Address.fromPrimitives({ ...adrs }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(
          `Failed to construct address from AddressEntity: ${e.message}`,
          e,
        ),
    );
  }
}
