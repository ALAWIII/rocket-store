import { Ok } from '@allawiii/results-ts';

export function optional<T, R>(
  value: T | null | undefined,
  create: (value: T) => R,
) {
  return value == null ? Ok(undefined) : create(value);
}
