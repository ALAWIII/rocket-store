import { Injectable, NotFoundException } from '@nestjs/common';
import { IOrderAddressRepository } from './infrastructure/repositories/order-address.repository';
import { CreateOrderAddressDto } from './dto/create-order-address.dto';

@Injectable()
export class OrderAddressService {
  constructor(private readonly oAdrsRepo: IOrderAddressRepository) {}

  async findByOrderId(userId: string, orderId: string) {
    const oadrs = (
      await this.oAdrsRepo.findByOrderId(userId, orderId)
    ).unwrap();
    return oadrs.map((oad) => oad.toJSON());
  }
  async createOAdrs(userId: string, data: CreateOrderAddressDto) {
    return (await this.oAdrsRepo.create(userId, data)).unwrap().toJSON();
  }
}
