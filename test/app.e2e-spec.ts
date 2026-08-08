import { TestDatabase } from './helpers/database-test.helper';
import { TestApp } from './helpers/app-test.helper';
import { MailhogClient } from 'mailhog-awesome';
import { SignupResult } from './helpers/signup-user-flow.builder';
import { createAuthenticatedTestContext } from './fixtures/create-authenticated-test-context.fixture';
import { extractRawCookieToken } from './helpers/extract-session-token.helper';

describe('AppController (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  let mailClient: MailhogClient;
  let adminUser: SignupResult;
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
  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
    await mailClient.deleteEmails({ to: adminUser.userDb.email });
  });
});
