import type { Result } from 'ts-results-es';
import type { DatabaseError } from './database.error';

export interface WithErrorContext {
  context: string[];
  withContext(ctx: string): this;
  withContextList(ctxs: string[]): this;
}
export interface LoggableError {
  toLog(): unknown;
}

export type DBResult<T> = Result<T, DatabaseError>;
