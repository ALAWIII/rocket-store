import { Err, Ok, Result } from 'ts-results-es';

export function tryWrap<T, E extends Error>(
  fn: () => T,
  errorMapper: (error: unknown) => E,
): Result<T, E> {
  try {
    return Ok(fn());
  } catch (error) {
    return Err(errorMapper(error));
  }
}

export async function tryWrapAsync<T, E extends Error>(
  fn: () => Promise<T>,
  errorMapper: (error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    return Ok(await fn());
  } catch (error) {
    return Err(errorMapper(error));
  }
}
