import { Injectable } from '@nestjs/common';
import { IOrderAddressRepository } from './infrastructure/repositories/order-address.repository';
import { CreateOrderAddressDto } from './dto/create-order-address.dto';
import { OrderAddressResponseDto } from './dto/order-address-response.dto';

@Injectable()
export class OrderAddressService {
  constructor(private readonly oAdrsRepo: IOrderAddressRepository) {}

  findByOrderId(userId: string, orderId: string): Promise<OrderAddressResponseDto[]> {
    return this.oAdrsRepo
      .findByOrderId(userId, orderId)
      .map((list) => list.map((oad) => oad.toJSON()))
      .unwrap();
  }

  createOrderAddress(userId: string, orderId: string, data: CreateOrderAddressDto): Promise<OrderAddressResponseDto> {
    return this.oAdrsRepo
      .create(userId, { orderId, ...data })
      .map((oad) => oad.toJSON())
      .unwrap();
  }
}
