import { Test } from 'supertest';

export function attachBodyFields<T extends object>(request: Test, data: T) {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue; // skip
    request.field(key, value);
  }
  return request;
}
