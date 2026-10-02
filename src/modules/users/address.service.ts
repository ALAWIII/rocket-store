import { Injectable } from '@nestjs/common';
import { IAddressRepository } from './infrastructure/repositories/address.repository';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './domain/address';
import { CreateAddressDto } from './dto/create-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';

@Injectable()
export class AddressService {
  constructor(private readonly addressRepo: IAddressRepository) {}

  findAll(userId: string): Promise<AddressResponseDto[]> {
    return this.addressRepo
      .findAll(userId)
      .map((addresses) => addresses.map((ad) => ad.toJSON()))
      .unwrap();
  }
  findById(userId: string, adrsId: string): Promise<AddressResponseDto> {
    return this.addressRepo
      .findById(userId, adrsId)
      .map((ad) => ad.toJSON())
      .unwrap();
  }
  deleteAdrs(userId: string, adrsId: string): Promise<number> {
    return this.addressRepo.delete({ userId, id: adrsId }).unwrap();
  }
  createAdrs(
    userId: string,
    data: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    const newAdrs = Address.create({
      userId,
      ...data,
    }).unwrap();
    return this.addressRepo
      .create(newAdrs)
      .map((ad) => ad.toJSON())
      .unwrap();
  }
  updateAdrs(
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
    return this.addressRepo
      .update(adrs)
      .map((ad) => ad.toJSON())
      .unwrap();
  }
}
