import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

type ErrorMapper<E extends Error = Error> = (error: E) => HttpException;
type ErrorConstructor<E extends Error = Error> = new (...args: any[]) => E;

@Injectable()
export class ErrorMapperRegistry {
  private readonly mappers = new Map<ErrorConstructor, ErrorMapper>();

  register<E extends Error>(
    errorClass: ErrorConstructor<E>,
    mapper: ErrorMapper<E>,
  ) {
    this.mappers.set(errorClass, mapper);
    return this;
  }

  map(error: Error): HttpException {
    for (const [errorClass, mapper] of this.mappers) {
      if (error instanceof errorClass) return mapper(error);
    }
    return new InternalServerErrorException('Internal server error');
  }
}
