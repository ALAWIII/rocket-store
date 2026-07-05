import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infrastructure/entities/user.entity';
import { IUserRepository } from './infrastructure/repositories/user.repository';
import { UserRepository } from './infrastructure/repositories/typeorm-user.repository';
import { IAddressRepository } from './infrastructure/repositories/address.repository';
import { AddressRepository } from './infrastructure/repositories/typeorm-address.repository';
import { IOrderAddressRepository } from './infrastructure/repositories/order-address.repository';
import { OrderAddressRepositroy } from './infrastructure/repositories/typeorm-order-address.repository';
import {
  AddressEntity,
  OrderAddressEntity,
} from './infrastructure/entities/address.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AddressEntity, OrderAddressEntity]),
  ],
  providers: [
    { provide: IUserRepository, useClass: UserRepository },
    { provide: IAddressRepository, useClass: AddressRepository },
    { provide: IOrderAddressRepository, useClass: OrderAddressRepositroy },
  ],
  exports: [IUserRepository, IAddressRepository, IOrderAddressRepository],
})
export class UsersModule {}
