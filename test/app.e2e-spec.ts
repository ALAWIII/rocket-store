import { TestDatabase } from './helpers/database-test.helper';
import { TestApp } from './helpers/app-test.helper';
import { MailhogClient } from 'mailhog-awesome';
import { BuildResult } from './helpers/signup-user-flow.builder';
import { SigninUserHelper } from './helpers/signin-user.helper';
import { createAuthenticatedTestContext } from './fixtures/create-authenticated-test-context.fixture';

describe('AppController (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  let mailClient: MailhogClient;
  let adminUser: BuildResult;
  beforeEach(async () => {
    ({ app, db, mailClient, adminUser } =
      await createAuthenticatedTestContext());

    await new SigninUserHelper(app.httpClient).signin({
      email: adminUser.payload.email,
      password: adminUser.payload.password,
    });
  });

  it('GET /api/auth/ok it should return 200 success', () => {
    const response = app.httpClient.get('/api/auth/ok');
    return response.expect(200);
  });
  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
    await mailClient.deleteEmails({ to: adminUser.userDb.email });
  });
});
