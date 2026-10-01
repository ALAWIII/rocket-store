import { AsyncResult } from '@allawiii/results-ts';
import type { DatabaseError } from './database.error';

export type DBResult<T> = AsyncResult<T, DatabaseError>;
