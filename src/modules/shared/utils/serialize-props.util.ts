type JsonSerializable = {
  toJSON(): unknown;
};

type JsonValue<T> = T extends { toJSON(): infer R } ? R : T;

export type Serialized<T extends Record<string, unknown>> = {
  [K in keyof T]: JsonValue<T[K]>;
};
export function serializeProps<T extends Record<string, unknown>>(
  props: T,
): Serialized<T> {
  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => [
      key,
      hasToJSON(value) ? value.toJSON() : value,
    ]),
  ) as Serialized<T>;
}

function hasToJSON(value: unknown): value is JsonSerializable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toJSON' in value &&
    typeof value.toJSON === 'function'
  );
}
