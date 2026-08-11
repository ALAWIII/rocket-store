import type { Response } from 'superagent';
import { ExpectedTestStatusCode } from '../types/expected-test-status-code.type';
/**
 * accepts superagent.Response type and tries to parse the body to a specific type based on a list of status codes.
 * @param response
 * @param statuses
 * @returns T
 */
export function parseResponseBody<T>(
  response: Response,
  statuses: number[],
): T | undefined {
  return statuses.includes(response.statusCode)
    ? (response.body as T)
    : undefined;
}

export const statusCodesListNormalize = (
  expectedStatusCode: ExpectedTestStatusCode,
) => [...(expectedStatusCode?.parseBody ? [expectedStatusCode.code] : [])];
