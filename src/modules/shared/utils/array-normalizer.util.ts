export function normalizeArray(value: unknown) {
  if (value == null) return undefined;

  const arr = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [value];

  const cleaned = arr.map((v) => (typeof v === 'string' ? v.trim() : v)).filter((v) => v !== '' && v != null);

  return cleaned.length ? cleaned : undefined;
}
