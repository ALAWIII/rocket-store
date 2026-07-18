import { Injectable } from '@nestjs/common';
import { Address } from '../../domain/address';
import { IAddressRepository } from './address.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AddressEntity } from '../entities/address.entity';
import { IsNull, Repository } from 'typeorm';
import { CorruptedPersistenceDataError } from 'src/modules/shared/errors/database.error';

@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(
    @InjectRepository(AddressEntity)
    private readonly addressRepo: Repository<AddressEntity>,
  ) {}
  async loadAll(): Promise<Address[]> {
    const addresses = await this.addressRepo.find();
    return addresses.map((adrs) => this.toDomain(adrs));
  }
  async findById(id: string): Promise<Address | null> {
    const result = await this.addressRepo.findOneBy({
      id,
      deletedAt: IsNull(),
    });
    return result ? this.toDomain(result) : null;
  }
  async remove(id: string): Promise<void> {
    await this.addressRepo.softDelete({ id });
  }
  async upsert(adrs: Address): Promise<Address> {
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
      throw new Error('Failed to upsert address');
    }

    return this.toDomain(row);
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
