import type { Response } from 'superagent';

export function parseResponseBody<T>(
  response: Response,
  expectedStatus: number,
): T | undefined {
  return response.statusCode === expectedStatus
    ? (response.body as T)
    : undefined;
}
