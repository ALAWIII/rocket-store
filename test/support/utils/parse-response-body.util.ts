import type { Response } from 'superagent';
/**
 * accepts superagent.Response type and tries to parse the body to a specific type based on a list of status codes.
 * @param response
 * @param statuses
 * @returns T
 */
export function parseResponseBody<T>(response: Response, parseBody: boolean = false): T | undefined {
  return parseBody ? (response.body as T) : undefined;
}
