export function trimToUndefined(value: unknown) {
  return typeof value === 'string' ? value.trim() || undefined : value;
}
