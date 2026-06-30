import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { DatabaseModule } from 'src/database/database.module';
import { DataSource } from 'typeorm';
import { createAuth } from './auth.config';

@Module({
  imports: [
    AuthModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [DataSource],
      useFactory: (dataSource: DataSource) => ({
        auth: createAuth(dataSource),
      }),
    }),
  ],
})
export class AppAuthModule {}
