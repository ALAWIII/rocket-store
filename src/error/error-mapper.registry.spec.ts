import { Test } from '@nestjs/testing';
import { ErrorMapperRegistry } from './error-mapper.registry';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

abstract class AppError extends Error {}
class Child1 extends AppError {}
class Child1_1 extends Child1 {}
class Child2 extends AppError {}

describe('ErrorMapperRegistry', () => {
  let registry: ErrorMapperRegistry;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ErrorMapperRegistry],
    }).compile();

    registry = moduleRef.get(ErrorMapperRegistry);
  });

  it('maps exact error type', () => {
    registry.register(AppError, (e) => new BadRequestException(e.message));
    registry.register(Child1, (e) => new ForbiddenException(e.message));

    const result = registry.map(new Child1('hello'));

    expect(result).toBeInstanceOf(ForbiddenException);
    expect(result).not.toBeInstanceOf(BadRequestException);
    expect(result?.getStatus()).not.toBe(400);
    expect(result?.getStatus()).toBe(403);
    expect(result?.message).toBe('hello');
  });
  it('maps direct parent error type for non-registered error child.', () => {
    registry.register(AppError, (e) => new BadRequestException(e.message));
    registry.register(Child1, (e) => new ForbiddenException(e.message));

    const result = registry.map(new Child1_1('hello'));

    expect(result).toBeInstanceOf(ForbiddenException);
    expect(result).not.toBeInstanceOf(BadRequestException);
    expect(result?.getStatus()).not.toBe(400);
    expect(result?.getStatus()).toBe(403);
    expect(result?.message).toBe('hello');
  });
  it('maps base class error type for unregistered grand child error.', () => {
    registry.register(AppError, (e) => new BadRequestException(e.message));

    const result = registry.map(new Child1_1('hello'));
    expect(result).toBeInstanceOf(BadRequestException);
    expect(result?.getStatus()).toBe(400);
    expect(result?.message).toBe('hello');
  });
  it('maps unregistered error class type falls back to default internal server error.', () => {
    registry.register(Child1, (e) => new BadRequestException(e.message));

    const result = registry.map(new Child2('hello'));
    expect(result).toBeInstanceOf(InternalServerErrorException);
    expect(result?.getStatus()).toBe(500);
    expect(result?.message).toBe('Internal server error');
  });
});
