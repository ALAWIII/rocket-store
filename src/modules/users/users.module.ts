import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infrastructure/entities/user.entity';
import { User as AuthUserEntity } from 'typeorm/entities/User';
import { IUserRepository } from './infrastructure/repositories/user.repository';
import { UserRepository } from './infrastructure/repositories/typeorm-user.repository';
import { IAuthUserRepository } from './infrastructure/repositories/auth-user.repository';
import { AuthUserRepository } from './infrastructure/repositories/typeorm-auth-user.repository';
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AuthUserEntity])],
  providers: [
    { provide: IUserRepository, useClass: UserRepository },
    { provide: IAuthUserRepository, useClass: AuthUserRepository },
  ],
  exports: [IUserRepository],
})
export class UsersModule {}
