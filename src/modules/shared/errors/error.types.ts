import type { Result } from 'ts-results-es';
import type { DatabaseError } from './database.error';

export type DBResult<T> = Result<T, DatabaseError>;
