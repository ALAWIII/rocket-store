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
export function mapTypeOrmError(e: unknown): DatabaseError {
  if (e instanceof EntityNotFoundError)
    return new RecordNotFoundError('Resource Not Found', e);
  if (e instanceof QueryFailedError) {
    const driver = e.driverError as PgDriverError; // pg error code
    if (driver.code === '23505')
      return new UniqueViolationError('Resource already exists', e);
    if (driver.code === '23503')
      return new ForeignKeyViolationError(
        'Referenced resource was not found',
        e,
      );
  }
  return new UnknownDatabaseError('Unexpected database error', e);
}
