import {
  LoggableError,
  WithErrorContext,
} from 'src/modules/shared/errors/error.types';
import { Result } from 'ts-results-es';
export type PermissionResult<T> = Result<T, PermissionError>;
export abstract class PermissionError
  extends Error
  implements LoggableError, WithErrorContext
{
  abstract readonly code: string;
  context: string[] = [];
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
  }
  withContext(ctx: string): this {
    this.context.push(ctx);
    return this;
  }
  withContextList(ctxs: string[]): this {
    this.context = [...this.context, ...ctxs];
    return this;
  }
  toLog() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
      cause:
        this.cause instanceof Error
          ? {
              name: this.cause.name,
              message: this.cause.message,
              stack: this.cause.stack,
            }
          : this.cause,
    };
  }
}

export class InvalidPermissionEntityError extends PermissionError {
  readonly code = 'INVALID_PERMISSION_ENTITY';

  constructor(entity: string) {
    super(`Unknown entity: ${entity}`);
  }
}
export class InvalidPermissionActionError extends PermissionError {
  readonly code = 'INVALID_PERMISSION_ACTION';

  constructor(action: string, entity: string) {
    super(`Unknown action "${action}" for entity "${entity}"`);
  }
}
export class InvalidPermissionScopeError extends PermissionError {
  readonly code = 'INVALID_PERMISSION_SCOPE';

  constructor(scope: string, entity: string) {
    super(`Unknown scope "${scope}" for entity "${entity}"`);
  }
}
export class InvalidPermissionFormatError extends PermissionError {
  readonly code = 'INVALID_PERMISSION_FORMAT';

  constructor(msg: string) {
    super(msg);
  }
}
