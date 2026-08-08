import { MailhogClient } from 'mailhog-awesome';
import { TestApp } from './helpers/app-test.helper';
import { TestDatabase } from './helpers/database-test.helper';
import { SignupResult } from './helpers/signup-user-flow.builder';
import { createAuthenticatedTestContext } from './fixtures/create-authenticated-test-context.fixture';
import { SYSTEM_ROLES } from 'src/modules/access-control/application/system-roles/system-roles.definition';

describe('access-control (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  let mailClient: MailhogClient;
  let adminUser: SignupResult;
  beforeEach(async () => {
    ({ app, db, mailClient, adminUser } =
      await createAuthenticatedTestContext());
  });
  describe('GET /api/v1/roles', () => {
    it('should return all roles for admin user.', async () => {
      const response = await adminUser.userAgent
        .get('/api/v1/roles')
        .expect(200);
      expect(response.body).toEqual(SYSTEM_ROLES.map((r) => r.toJSON()));
    });
  });
  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
    await mailClient.deleteEmails({ to: adminUser.userDb.email });
  });
});
