import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppExceptionFilter } from './app-exception.filter';
import { ErrorMappingBootstrap } from './error-mapping.bootstrap.service';
import { ErrorMapperRegistry } from './error-mapper.registry';

@Module({
  providers: [
    AppExceptionFilter,
    ErrorMapperRegistry,
    ErrorMappingBootstrap,
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
  exports: [ErrorMapperRegistry],
})
export class AppErrorModule {}
