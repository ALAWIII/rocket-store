import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { DataSource } from 'typeorm';
import { createAuth } from './auth.config';
export const AUTH = 'AUTH';
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],

  providers: [
    {
      provide: AUTH,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) => {
        return createAuth(dataSource);
      },
    },
  ],

  exports: [AUTH],
})
export class AuthModule {}
