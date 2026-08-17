import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infrastructure/entities/user.entity';
import { IUserRepository } from './infrastructure/repositories/user.repository';
import { UserRepository } from './infrastructure/repositories/user.typeorm.repository';
import { IAddressRepository } from './infrastructure/repositories/address.repository';
import { AddressRepository } from './infrastructure/repositories/address.typeorm.repository';
import { AddressEntity } from './infrastructure/entities/address.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AddressService } from './address.service';
import {
  MyAddressesController,
  UserAddressesController,
} from './addresses.controller';
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AddressEntity])],
  providers: [
    { provide: IUserRepository, useClass: UserRepository },
    { provide: IAddressRepository, useClass: AddressRepository },
    UsersService,
    AddressService,
  ],
  exports: [IUserRepository, IAddressRepository],
  controllers: [
    UsersController,
    MyAddressesController,
    UserAddressesController,
  ],
})
export class UsersModule {}
