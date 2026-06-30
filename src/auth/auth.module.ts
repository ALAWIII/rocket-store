import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { DatabaseModule } from 'src/database/database.module';
import { DataSource } from 'typeorm';
import { createAuth } from './auth.config';
import { UsersModule } from 'src/modules/users/users.module';
import { IUserRepository } from 'src/modules/users/infrastructure/repositories/user.repository';

@Module({
  imports: [
    AuthModule.forRootAsync({
      imports: [DatabaseModule, UsersModule],
      inject: [DataSource, IUserRepository],
      useFactory: (dataSource: DataSource, userRepo: IUserRepository) => ({
        auth: createAuth(dataSource, userRepo),
      }),
    }),
  ],
})
export class AppAuthModule {}
