import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorMapperRegistry } from './error-mapper.registry';
import { isLoggableError } from 'src/modules/shared/errors/error.types';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);
  constructor(private readonly registry: ErrorMapperRegistry) {}

  catch(exception: unknown, host: ArgumentsHost) {
    this.logException(exception);

    const httpException =
      exception instanceof Error
        ? this.registry.map(exception)
        : new InternalServerErrorException('Internal server error');

    const res = host.switchToHttp().getResponse<Response>();
    res.status(httpException.getStatus()).json(httpException.getResponse());
  }
  private logException(exception: unknown) {
    if (isLoggableError(exception)) {
      this.logger.error(exception.toLog());
      return;
    }
    if (exception instanceof Error) {
      this.logger.error({
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      });
      return;
    }

    this.logger.error({ message: 'Non-Error exception thrown', exception });
  }
}
