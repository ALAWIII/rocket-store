import { Injectable, NotFoundException } from '@nestjs/common';
import { IAddressRepository } from './infrastructure/repositories/address.repository';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './domain/address';

@Injectable()
export class AddressService {
  constructor(private readonly addressRepo: IAddressRepository) {}
  async findAll(userId: string) {
    const addresses = (await this.addressRepo.findAll(userId)).unwrap();
    return addresses.map((ad) => ad.toPrimitives());
  }
  async findById(adrsId: string) {
    const address = (await this.addressRepo.findById(adrsId)).unwrap();
    if (address.isNone())
      throw new NotFoundException(`Address ${adrsId} not found.`);

    return address.unwrap();
  }
  async updateAdrs(id: string, userId: string, data: UpdateAddressDto) {
    const adrs = Address.fromPrimitives({
      ...data,
      id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).unwrap();
    return (await this.addressRepo.update(adrs)).unwrap();
  }
}
