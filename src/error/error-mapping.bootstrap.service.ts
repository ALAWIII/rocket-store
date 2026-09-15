import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ErrorMapperRegistry } from './error-mapper.registry';
import {
  DatabaseError,
  RecordNotFoundError,
  UniqueViolationError,
} from 'src/modules/shared/errors/database.error';
import { PermissionError } from 'src/modules/access-control/domain/permission.error';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { SystemRoleError } from 'src/modules/access-control/application/system-roles/system-roles.error';
import { RoleServiceError } from 'src/modules/access-control/role.error.service';
import { RoleError } from 'src/modules/access-control/domain/role.error';
import {
  ImageMaxSizeExceededError,
  ImageNotFoundError,
  ImageServiceError,
} from 'src/modules/images/images.service.error';

@Injectable()
export class ErrorMappingBootstrap implements OnModuleInit {
  constructor(private readonly registry: ErrorMapperRegistry) {}
  onModuleInit() {
    this.registry
      .register(RecordNotFoundError, (e) => new NotFoundException(e.message))
      .register(UniqueViolationError, (e) => new ConflictException(e.message))
      .register(PermissionError, (e) => new BadRequestException(e.message))
      .register(SystemRoleError, (e) => new BadRequestException(e.message))
      .register(RoleServiceError, (e) => new ForbiddenException(e.message))
      .register(RoleError, (e) => new BadRequestException(e.message))
      .register(
        DatabaseError,
        (e) => new InternalServerErrorException('unexpected error'),
      )
      .register(
        ValueObjectError,
        (e) => new UnprocessableEntityException(e.message),
      )
      .register(
        ImageServiceError,
        (e) => new InternalServerErrorException(e.message),
      )
      .register(ImageNotFoundError, (e) => new NotFoundException(e.message))
      .register(
        ImageMaxSizeExceededError,
        (e) => new PayloadTooLargeException(e.message),
      );
  }
}
