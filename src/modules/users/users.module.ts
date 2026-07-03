import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infrastructure/entities/user.entity';
import { User as AuthUserEntity } from 'typeorm/entities/User';
import { IUserRepository } from './infrastructure/repositories/user.repository';
import { UserRepository } from './infrastructure/repositories/typeorm-user.repository';
import { IAuthUserRepository } from './infrastructure/repositories/auth-user.repository';
import { AuthUserRepository } from './infrastructure/repositories/typeorm-auth-user.repository';
import { IAddressRepository } from './infrastructure/repositories/address.repository';
import { AddressRepository } from './infrastructure/repositories/typeorm-address.repository';
import { IOrderAddressRepository } from './infrastructure/repositories/order-address.repository';
import { OrderAddressRepositroy } from './infrastructure/repositories/typeorm-order-address.repository';
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AuthUserEntity])],
  providers: [
    { provide: IUserRepository, useClass: UserRepository },
    { provide: IAuthUserRepository, useClass: AuthUserRepository },
    { provide: IAddressRepository, useClass: AddressRepository },
    { provide: IOrderAddressRepository, useClass: OrderAddressRepositroy },
  ],
  exports: [IUserRepository, IAddressRepository, IOrderAddressRepository],
})
export class UsersModule {}
