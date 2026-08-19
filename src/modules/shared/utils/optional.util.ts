import { Ok } from 'ts-results-es';

export function optional<T, R>(
  value: T | null | undefined,
  create: (value: T) => R,
) {
  return value == null ? Ok(undefined) : create(value);
}
