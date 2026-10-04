import { Injectable } from '@nestjs/common';
import { Address } from '../../domain/address';
import { IAddressRepository } from './address.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AddressEntity } from '../entities/address.entity';
import { IsNull, Repository } from 'typeorm';
import { RecordNotFoundError } from 'src/modules/shared/errors/database.error';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { Result } from '@allawiii/results-ts';
import { mapTypeOrmError } from 'src/modules/shared/errors/mappers/database-error.mapper';
import { AddressMapper } from '../mappers/address.mapper';

@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(
    @InjectRepository(AddressEntity)
    private readonly addressRepo: Repository<AddressEntity>,
  ) {}
  findAll(userId: string): DBResult<Address[]> {
    return Result.wrapAsync(() => this.addressRepo.findBy({ userId }))
      .andThen((entities) => AddressMapper.toDomainList(entities))
      .mapErr(mapTypeOrmError);
  }
  findById(userId: string, id: string): DBResult<Address> {
    return Result.wrapAsync(() =>
      this.addressRepo.findOneByOrFail({
        id,
        userId,
        deletedAt: IsNull(),
      }),
    )
      .andThen((entity) => AddressMapper.toDomain(entity))
      .mapErr(mapTypeOrmError);
  }
  create(adrs: Address): DBResult<Address> {
    return Result.wrapAsync(async () => {
      const { createdAt, updatedAt, deletedAt, ...values } = adrs.toJSON();
      const entity = this.addressRepo.create(values);
      return await this.addressRepo.save(entity);
    })
      .andThen((entity) => AddressMapper.toDomain(entity))
      .mapErr(mapTypeOrmError);
  }
  delete(d: { id: string; userId: string }): DBResult<number> {
    return Result.wrapAsync(async () => {
      const result = await this.addressRepo.softDelete({
        id: d.id,
        userId: d.userId,
      });
      return result.affected ?? 0;
    }).mapErr(mapTypeOrmError);
  }
  update(adrs: Address): DBResult<Address> {
    return Result.wrapAsync(async () => {
      const { id, userId, createdAt, updatedAt, deletedAt, ...values } = adrs.toJSON();

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
        throw new RecordNotFoundError(`Update address not found: ${id}`);
      }

      return address;
    })
      .andThen((entity) => AddressMapper.toDomain(entity))
      .mapErr(mapTypeOrmError);
  }
}
