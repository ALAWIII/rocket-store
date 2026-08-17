// extract common keys of shape and given object.
type CommonKey<T extends object, U extends object> = Extract<keyof T, keyof U>;

type PickFrom<T extends object, U extends object> = {
  [K in CommonKey<T, U>]: U[K];
};

export function pickSharedFields<T extends object, U extends object>(
  shape: T,
  object: U,
): PickFrom<T, U> {
  const result = {} as PickFrom<T, U>;

  for (const key of Object.keys(shape)) {
    if (key in object) {
      const commonKey = key as CommonKey<T, U>;

      (result as Record<string, unknown>)[key] = object[commonKey as keyof U];
    }
  }

  return result;
}
