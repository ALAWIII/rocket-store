import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { DataSource } from 'typeorm';
import { createAuth } from './auth.config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
const AUTH = 'AUTH';
const AuthProvider = {
  provide: AUTH,
  inject: [DataSource],
  useFactory: (dataSource: DataSource) => {
    return createAuth(dataSource);
  },
};
const GlobalGuardProvider = { provide: APP_GUARD, useClass: AuthGuard };
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthProvider, GlobalGuardProvider],
})
export class AuthModule {}
