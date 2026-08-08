import { MailhogClient } from 'mailhog-awesome';
import { TestApp } from './helpers/app-test.helper';
import { TestDatabase } from './helpers/database-test.helper';
import {
  AuthUserResult,
  UserAuthFlowBuilder,
} from './helpers/auth-user-flow.builder';
import { createAuthenticatedTestContext } from './fixtures/create-authenticated-test-context.fixture';
import { SYSTEM_ROLES } from 'src/modules/access-control/application/system-roles/system-roles.definition';

describe('access-control (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  let mailClient: MailhogClient;
  let adminUser: AuthUserResult;
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
    it('should return 403 forbidden when an unauthorized user request roles without having roles.read permission.', async () => {
      const userAgent = app.createAgent();
      const customer = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent,
      })
        .random()
        .asRole('customer')
        .verified()
        .signin()
        .build();
      await customer.userAgent.get('/api/v1/roles').expect(403);
    });
  });
  describe('POST /api/v1/roles/policies/reload', () => {
    it('should successfully reload policies in the system internally.', async () => {
      const resp = await adminUser.userAgent
        .post('/api/v1/roles/policies/reload')
        .expect(200);
      expect(resp.body).toStrictEqual({ attempt: 2 });
    });
  });
  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
    await mailClient.deleteEmails({ to: adminUser.userDb.email });
  });
});
