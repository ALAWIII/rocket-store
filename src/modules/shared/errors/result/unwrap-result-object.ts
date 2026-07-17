import { Ok, Err, Result } from 'ts-results-es';

type ExtractOk<T> = T extends Ok<infer U> ? U : never;
type ExtractErr<T> = T extends Err<infer E> ? E : never;

type UnwrapResultObjectOk<T extends Record<string, Result<any, any>>> = {
  [K in keyof T]: ExtractOk<T[K]>;
};

type ResultObjectError<T extends Record<string, Result<any, any>>> = ExtractErr<
  T[keyof T]
>;

/**
 * Unwraps an object whose values are `Result` instances and returns a new object
 * with the same keys and their successful values.
 *
 * This is a fail-fast helper: iteration stops at the first `Err` and that error
 * is returned immediately. Use it when one validation failure is enough to abort
 * object construction.
 *
 * The returned success type preserves the input keys and unwraps each `Result`
 * value into its corresponding `Ok` value.
 *
 * @template T Object shape whose values are `Result<Ok, E>`.
 * @template E Error type carried by each `Result`.
 * @param obj Object containing `Result` values to unwrap.
 * @returns `Ok(unwrappedObject)` when all fields are successful, otherwise the first `Err`.
 *
 * @example
 * const validated = unwrapResultObject({
 *   email: Email.create(data.email),
 *   name: Name.create(data.name),
 *   phone: data.phone ? Phone.create(data.phone) : Ok(undefined),
 * });
 *
 * if (validated.isErr()) return validated;
 *
 * const user = new User(validated.value);
 */
export function unwrapResultObject<T extends Record<string, Result<any, any>>>(
  obj: T,
): Result<UnwrapResultObjectOk<T>, ResultObjectError<T>> {
  const output = {} as UnwrapResultObjectOk<T>;

  for (const key in obj) {
    const result = obj[key];

    if (result.isErr()) {
      return Err(result.error as ResultObjectError<T>);
    }

    output[key] = result.value as UnwrapResultObjectOk<T>[typeof key];
  }

  return Ok(output);
}
//=================================================
type FieldError<T extends string, E> = {
  field: T;
  error: E;
};
/**
 * Unwraps an object whose values are `Result` instances and returns a new object
 * with the same keys and their successful values when all fields succeed.
 *
 * This version collects all failures instead of stopping at the first one.
 * Use it for validation scenarios where you want to report every invalid field
 * in a single pass.
 *
 * On failure, it returns an array of field-aware errors so the caller can map
 * each error back to the property that produced it.
 *
 * @template T Object shape whose values are `Result<Ok, E>`.
 * @template E Error type carried by each `Result`.
 * @param obj Object containing `Result` values to unwrap.
 * @returns `Ok(unwrappedObject)` when all fields are successful, otherwise `Err(fieldErrors)`.
 *
 * @example
 * const validated = unwrapResultObjectWithFields({
 *   email: Email.create(data.email),
 *   name: Name.create(data.name),
 *   givenName: Name.create(data.givenName),
 *   familyName: Name.create(data.familyName),
 * });
 *
 * if (validated.isErr()) {
 *   return validated.error.map(({ field, error }) => ({
 *     field,
 *     message: error.message,
 *   }));
 * }
 *
 * const user = new User(validated.value);
 */
export function collectResultObjectErrors<
  T extends Record<string, Result<any, E>>,
  E extends Error,
>(
  obj: T,
): Result<UnwrapResultObjectOk<T>, FieldError<Extract<keyof T, string>, E>[]> {
  const output = {} as UnwrapResultObjectOk<T>;
  const errorList: FieldError<Extract<keyof T, string>, E>[] = [];

  for (const key in obj) {
    const result = obj[key];

    if (result.isErr()) {
      errorList.push({
        field: key,
        error: result.error,
      });
      continue;
    }

    output[key] = result.value as UnwrapResultObjectOk<T>[typeof key];
  }

  return errorList.length > 0 ? Err(errorList) : Ok(output);
}
