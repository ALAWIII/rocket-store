import { Injectable, NotFoundException } from '@nestjs/common';
import { IAddressRepository } from './infrastructure/repositories/address.repository';

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
}
