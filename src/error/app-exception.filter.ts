import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorMapperRegistry } from './error-mapper.registry';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(private readonly registry: ErrorMapperRegistry) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const httpException =
      exception instanceof Error
        ? this.registry.map(exception)
        : new InternalServerErrorException('Internal server error');

    res.status(httpException.getStatus()).json(httpException.getResponse());
  }
}
