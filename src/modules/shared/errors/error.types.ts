import { Result } from '@allawiii/results-ts';
import type { DatabaseError } from './database.error';

export type DBResult<T> = Result<T, DatabaseError>;
