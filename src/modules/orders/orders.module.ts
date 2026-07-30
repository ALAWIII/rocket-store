import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderAddressEntity } from './infrastructure/entities/order-address.entity';
import { OrderEntity } from './infrastructure/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, OrderAddressEntity])],
})
export class OrdersModule {}
