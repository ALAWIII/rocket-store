import { Injectable } from '@nestjs/common';
import { IOrderAddressRepository } from './infrastructure/repositories/order-address.repository';
import { CreateOrderAddressDto } from './dto/create-order-address.dto';
import { OrderAddressResponseDto } from './dto/order-address-response.dto';

@Injectable()
export class OrderAddressService {
  constructor(private readonly oAdrsRepo: IOrderAddressRepository) {}

  async findByOrderId(
    userId: string,
    orderId: string,
  ): Promise<OrderAddressResponseDto[]> {
    const oadrs = (
      await this.oAdrsRepo.findByOrderId(userId, orderId)
    ).unwrap();
    return oadrs.map((oad) => oad.toJSON());
  }
  async createOAdrs(
    userId: string,
    orderId: string,
    data: CreateOrderAddressDto,
  ): Promise<OrderAddressResponseDto> {
    return (await this.oAdrsRepo.create(userId, { orderId, ...data }))
      .unwrap()
      .toJSON();
  }
}
