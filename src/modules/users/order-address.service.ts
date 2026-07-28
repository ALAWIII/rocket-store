import { Injectable, NotFoundException } from '@nestjs/common';
import { IOrderAddressRepository } from './infrastructure/repositories/order-address.repository';
import { CreateOrderAddressDto } from './dto/create-order-address.dto';

@Injectable()
export class OrderAddressService {
  constructor(private readonly oAdrsRepo: IOrderAddressRepository) {}
  async findById(adrsId: string) {
    const oadrs = (await this.oAdrsRepo.findById(adrsId)).unwrap();
    if (oadrs.isNone()) {
      throw new NotFoundException(
        `Order Address with id: ${adrsId} is not found.`,
      );
    }
    return oadrs.unwrap().toPrimitives();
  }
  async findByOrderId(orderId: string) {
    const oadrs = (await this.oAdrsRepo.findByOrderId(orderId)).unwrap();

    return oadrs.map((oad) => oad.toPrimitives());
  }
  async createOAdrs(userId: string, data: CreateOrderAddressDto) {
    return (await this.oAdrsRepo.create(userId, data)).unwrap().toPrimitives();
  }
}
