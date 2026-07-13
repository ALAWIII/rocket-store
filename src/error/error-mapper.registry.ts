import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

type ErrorMapper<E extends Error = Error> = (error: E) => HttpException;
type ErrorClass<E extends Error = Error> =
  | (abstract new (...args: any[]) => E)
  | (new (...args: any[]) => E);

const getCtor = (value: object): ErrorClass<Error> =>
  (value as { constructor: ErrorClass<Error> }).constructor;
@Injectable()
export class ErrorMapperRegistry {
  private readonly mappers = new Map<ErrorClass, ErrorMapper>();

  register<E extends Error>(errorClass: ErrorClass<E>, mapper: ErrorMapper<E>) {
    this.mappers.set(errorClass, mapper);
    return this;
  }

  map(error: Error): HttpException {
    const exact = this.mappers.get(error.constructor as ErrorClass<Error>);
    if (exact) return exact(error);

    let proto: object | null = Object.getPrototypeOf(error) as object | null;
    while (proto) {
      const mapper = this.mappers.get(getCtor(proto));
      if (mapper) return mapper(error);
      proto = Object.getPrototypeOf(proto) as object | null;
    }

    return new InternalServerErrorException('Internal server error');
  }
}
