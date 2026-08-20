import { DBResult } from '../error.types';
import { mapTypeOrmError } from '../mappers/database-error.mapper';
import { tryWrapAsync } from './try-wrap';

export async function tryWrapDatabase<T>(
  fn: () => Promise<T>,
): Promise<DBResult<T>> {
  return await tryWrapAsync(fn, mapTypeOrmError);
}
