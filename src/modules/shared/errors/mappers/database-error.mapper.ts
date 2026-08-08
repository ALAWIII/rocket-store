import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import {
  DatabaseError,
  ForeignKeyViolationError,
  RecordNotFoundError,
  UniqueViolationError,
  UnknownDatabaseError,
} from '../database.error';
type PgDriverError = Error & {
  code?: string;
  detail?: string;
  constraint?: string;
};
export function mapTypeOrmError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  if (error instanceof EntityNotFoundError) {
    return new RecordNotFoundError('Resource not found', error);
  }

  if (error instanceof QueryFailedError) {
    const driver = error.driverError as PgDriverError;

    if (driver.code === '23505') {
      return new UniqueViolationError('Resource already exists', error);
    }

    if (driver.code === '23503') {
      return new ForeignKeyViolationError(
        'Referenced resource was not found',
        error,
      );
    }
  }

  return new UnknownDatabaseError('Unexpected database error', error);
}
