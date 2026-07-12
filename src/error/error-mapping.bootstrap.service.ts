import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ErrorMapperRegistry } from './error-mapper.registry';
import {
  RecordNotFoundError,
  UniqueViolationError,
} from 'src/modules/shared/errors/database.error';
import { InvalidPermissionEntityError } from 'src/modules/access-control/domain/permission.error';

@Injectable()
export class ErrorMappingBootstrap implements OnModuleInit {
  constructor(private readonly registry: ErrorMapperRegistry) {}
  onModuleInit() {
    this.registry
      .register(RecordNotFoundError, (e) => new NotFoundException(e.message))
      .register(UniqueViolationError, (e) => new ConflictException(e.message))
      .register(
        InvalidPermissionEntityError,
        (e) => new BadRequestException(e.message),
      );
  }
}
