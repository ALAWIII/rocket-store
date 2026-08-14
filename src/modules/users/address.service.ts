import { Injectable, NotFoundException } from '@nestjs/common';
import { IAddressRepository } from './infrastructure/repositories/address.repository';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './domain/address';
import { CreateAddressDto } from './dto/create-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';

@Injectable()
export class AddressService {
  constructor(private readonly addressRepo: IAddressRepository) {}

  async findAll(userId: string): Promise<AddressResponseDto[]> {
    const addresses = (await this.addressRepo.findAll(userId)).unwrapOrThrow();
    return addresses.map((ad) => ad.toJSON());
  }
  async findById(userId: string, adrsId: string): Promise<AddressResponseDto> {
    const address = (
      await this.addressRepo.findById(userId, adrsId)
    ).unwrapOrThrow();
    if (address.isNone())
      throw new NotFoundException(`Address ${adrsId} not found.`);

    return address.unwrap().toJSON();
  }
  async deleteAdrs(userId: string, adrsId: string): Promise<number> {
    return (
      await this.addressRepo.delete({ userId, id: adrsId })
    ).unwrapOrThrow();
  }
  async createAdrs(
    userId: string,
    data: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    const newAdrs = Address.create({
      userId,
      ...data,
    }).unwrapOrThrow();
    return (await this.addressRepo.create(newAdrs)).unwrapOrThrow().toJSON();
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
    }).unwrapOrThrow();
    return (await this.addressRepo.update(adrs)).unwrapOrThrow().toJSON();
  }
}
