import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database/database.module';

import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { authProvider } from './auth.provider';
import { AuthService } from './auth.service';

const GlobalGuardProvider = { provide: APP_GUARD, useClass: AuthGuard };
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [authProvider, AuthService, GlobalGuardProvider, AuthService],
  exports: [authProvider, AuthService],
})
export class AuthModule {}
