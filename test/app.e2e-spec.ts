import { TestDatabase } from './support/helpers/database-test.helper';
import { TestApp } from './support/helpers/app-test.helper';
import { MailhogClient } from 'mailhog-awesome';
import { AuthUserResult } from './support/helpers/auth-user-flow.builder';
import { createAuthenticatedTestContext } from './support/fixtures/create-authenticated-test-context.fixture';
import { extractRawCookieToken } from './support/helpers/extract-session-token.helper';

describe('AppController (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  let mailClient: MailhogClient;
  let adminUser: AuthUserResult;
  beforeEach(async () => {
    ({ app, db, mailClient, adminUser } =
      await createAuthenticatedTestContext());
  });

  it('GET /api/auth/ok it should return 200 success', () => {
    const response = app.httpClient.get('/api/auth/ok');
    return response.expect(200);
  });

  it('admin user cookie session token must be stored in database sessions table.', async () => {
    const token = extractRawCookieToken(
      adminUser.userAgent,
      'better-auth.session_token',
    ).split('.')[0];
    const dbToken = await db.dataSource.query<{ token: string }[]>(
      'select token from sessions where "userId" = $1',
      [adminUser.userDb.id],
    );
    expect(dbToken.some((row: { token: string }) => row.token === token)).toBe(
      true,
    );
  });
  describe('GET /api/auth/get-session', () => {
    it('should return session user profile.', async () => {
      const response = await adminUser.userAgent
        .get('/api/auth/get-session')
        .expect(200);
      const sessionBody = response.body as SessionResponse;
      expect(sessionBody.user.id).toEqual(adminUser.userDb.id);
      expect(sessionBody.session.userId).toEqual(adminUser.userDb.id);
      expect(sessionBody.user.roleId).toEqual(adminUser.userDb.roleId);
      expect(sessionBody.session.roleId).toEqual(adminUser.userDb.roleId);
    });
  });
  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
  });
});
type SessionResponse = {
  user: {
    name: string;
    email: string;
    emailVerified: true;
    image?: null | string;
    createdAt: string;
    updatedAt: string;
    phone: null;
    id: string;
    roleId: string;
  };
  session: {
    expiresAt: string;
    token: string;
    createdAt: string;
    updatedAt: string;
    ipAddress: string;
    userAgent: string;
    userId: string;
    roleId: string;
    id: string;
  };
};
