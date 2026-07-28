import { Injectable, NotFoundException } from '@nestjs/common';
import { IAddressRepository } from './infrastructure/repositories/address.repository';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './domain/address';
import { CreateAddressDto } from './dto/create-address.dto';
import { AddressId } from '../shared/domain/ids';
import { AddressResponseDto } from './dto/address-response.dto';

@Injectable()
export class AddressService {
  constructor(private readonly addressRepo: IAddressRepository) {}

  async findAll(userId: string): Promise<AddressResponseDto[]> {
    const addresses = (await this.addressRepo.findAll(userId)).unwrap();
    return addresses.map((ad) => ad.toPrimitives());
  }
  async findById(userId: string, adrsId: string): Promise<AddressResponseDto> {
    const address = (await this.addressRepo.findById(userId, adrsId)).unwrap();
    if (address.isNone())
      throw new NotFoundException(`Address ${adrsId} not found.`);

    return address.unwrap().toPrimitives();
  }
  async deleteAdrs(userId: string, adrsId: string): Promise<number> {
    return (await this.addressRepo.delete({ userId, id: adrsId })).unwrap();
  }
  async createAdrs(
    userId: string,
    data: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    const newDate = new Date();
    const newAdrs = Address.fromPrimitives({
      id: AddressId.create().toString(),
      userId,
      ...data,
      createdAt: newDate,
      updatedAt: newDate,
    }).unwrap();
    return (await this.addressRepo.create(newAdrs)).unwrap().toPrimitives();
  }
  async updateAdrs(
    userId: string,
    id: string,
    data: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    const adrs = Address.fromPrimitives({
      ...data,
      id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).unwrap();
    return (await this.addressRepo.update(adrs)).unwrap().toPrimitives();
  }
}
