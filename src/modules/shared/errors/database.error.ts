import { LoggableError, WithErrorContext } from './error.types';

export abstract class DatabaseError
  extends Error
  implements LoggableError, WithErrorContext
{
  abstract readonly code: string;
  protected _context: string[] = [];
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
  }
  withContext(msg: string): this {
    this._context.push(msg);
    return this;
  }
  withContextList(ctxs: string[]): this {
    this._context = [...this._context, ...ctxs];
    return this;
  }
  get context(): string[] {
    return [...this._context];
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

export class UniqueViolationError extends DatabaseError {
  readonly code = 'UNIQUE_VIOLATION' as const;
}
export class ForeignKeyViolationError extends DatabaseError {
  readonly code = 'FK_VIOLATION' as const;
}
export class RecordNotFoundError extends DatabaseError {
  readonly code = 'NOT_FOUND' as const;
}
export class UnknownDatabaseError extends DatabaseError {
  readonly code = 'UNKNOWN' as const;
}
