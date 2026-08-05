import { UserAgent } from './app-test.helper';

export function extractRawSessionToken(userAgent: UserAgent): string {
  const cookies = userAgent.jar.getCookies({
    domain: '127.0.0.1',
    path: '/',
    secure: false,
    script: false,
  });

  const sessionCookie = cookies.find(
    (cookie) => cookie.name === 'better-auth.session_token',
  );

  if (!sessionCookie?.value) {
    throw new Error('better-auth.session_token was not found');
  }

  return sessionCookie.value;
}

export function extractFullDecodedSessionToken(userAgent: UserAgent): string {
  const rawToken = extractRawSessionToken(userAgent);
  return decodeURIComponent(rawToken);
}
