import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { OrderAddressService } from './order-address.service';
import { Session } from '@thallesp/nestjs-better-auth';
import { type AppSession } from 'src/auth/auth.config';
import { CreateOrderAddressDto } from './dto/create-order-address.dto';
import { OrderAddressResponseDto } from './dto/order-address-response.dto';

@Controller('orders')
export class OrderAddressController {
  constructor(private readonly service: OrderAddressService) {}

  @Get(':orderId/address')
  findByOrderId(
    @Session() session: AppSession,
    @Param('orderId', new ParseUUIDPipe({ version: '7' })) orderId: string,
  ): Promise<OrderAddressResponseDto[]> {
    return this.service.findByOrderId(session.user.id, orderId);
  }

  @Post(':orderId/address')
  create(
    @Session() session: AppSession,
    @Param('orderId', new ParseUUIDPipe({ version: '7' })) orderId: string,
    @Body() data: CreateOrderAddressDto,
  ): Promise<OrderAddressResponseDto> {
    return this.service.createOrderAddress(session.user.id, orderId, data);
  }
}
