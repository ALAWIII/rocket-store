import { UserAgent } from '../helpers/app-test.helper';

export function extractRawCookieToken(
  userAgent: UserAgent,
  cookieName: string,
): string {
  const cookies = userAgent.jar.getCookies({
    domain: '127.0.0.1',
    path: '/',
    secure: false,
    script: false,
  });

  const sessionCookie = cookies.find((cookie) => cookie.name === cookieName);

  if (!sessionCookie?.value) {
    throw new Error(`${cookieName} was not found`);
  }

  return sessionCookie.value;
}

export function extractDecodedSessionToken(userAgent: UserAgent): string {
  const rawToken = extractRawCookieToken(
    userAgent,
    'better-auth.session_token',
  );
  return decodeURIComponent(rawToken);
}
