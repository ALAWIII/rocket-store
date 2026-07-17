import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { DatabaseModule } from 'src/database/database.module';
import { DataSource } from 'typeorm';
import { createAuth } from './auth.config';
import { ConfigService } from '@nestjs/config';
import { AppLogLevel, toAppLogLevel } from 'src/app-logger/app-log.level';
import { PinoLogger } from 'nestjs-pino';

@Module({
  imports: [
    AuthModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [DataSource, PinoLogger, ConfigService],
      useFactory: (
        dataSource: DataSource,
        logger: PinoLogger,
        config: ConfigService,
      ) => {
        const logLevel: AppLogLevel = toAppLogLevel(config.get('LOG_LEVEL'));
        return { auth: createAuth(dataSource, logger, logLevel) };
      },
    }),
  ],
})
export class AppAuthModule {}
