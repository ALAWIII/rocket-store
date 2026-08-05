import { MailhogClient } from 'mailhog-awesome';
import { TestApp } from './helpers/app-test.helper';
import { TestDatabase } from './helpers/database-test.helper';
import { BuildResult } from './helpers/signup-user-flow.builder';
import { createAuthenticatedTestContext } from './fixtures/create-authenticated-test-context.fixture';

describe('users (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  let mailClient: MailhogClient;
  let adminUser: BuildResult;
  beforeEach(async () => {
    ({ app, db, mailClient, adminUser } =
      await createAuthenticatedTestContext());
  });
  describe('GET /api/v1/users/me', () => {
    it('should return user profile.', async () => {
      const response = await adminUser.userAgent.get('/api/v1/users/me');

      console.log(response.status, response.body);
    });
  });
  describe('GET /api/auth/get-session', () => {
    it('should return user profile.', async () => {
      const response = await adminUser.userAgent.get('/api/auth/get-session');

      console.log(response.status, response.body);
    });
  });
  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
    await mailClient.deleteEmails({ to: adminUser.userDb.email });
  });
});
