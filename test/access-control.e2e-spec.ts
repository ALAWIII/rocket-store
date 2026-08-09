import { MailhogClient } from 'mailhog-awesome';
import { TestApp } from './helpers/app-test.helper';
import { TestDatabase } from './helpers/database-test.helper';
import {
  AuthUserResult,
  UserAuthFlowBuilder,
} from './helpers/auth-user-flow.builder';
import { createAuthenticatedTestContext } from './fixtures/create-authenticated-test-context.fixture';
import {
  ADMIN_ROLE,
  SYSTEM_ROLES,
} from 'src/modules/access-control/application/system-roles/system-roles.definition';
import { AllPermissions } from 'src/modules/access-control/domain/permission';
import { Role } from 'src/modules/access-control/domain/role';

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
    it('should return all assignable roles only.', async () => {
      const role = ADMIN_ROLE.toJSON();
      const response = await adminUser.userAgent
        .get('/api/v1/roles?scope=assignable')
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
  describe('POST /api/v1/roles', () => {
    it('should successfully create new role.', async () => {
      const newRole = {
        name: 'babyadmin',
        permissions: [
          AllPermissions.user.UserReadLessOrEqual,
          AllPermissions.role.RoleReadLessOrEqual,
          AllPermissions.role.RoleAssignLessOrEqual,
        ],
        assignScope: [AllPermissions.user.UserReadLessOrEqual],
      };
      const response = await adminUser.userAgent
        .post('/api/v1/roles')
        .send(newRole)
        .expect(201);
      const userAgent = app.createAgent();
      const newUser = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent,
      })
        .asRole('babyadmin')
        .random()
        .verified()
        .signin()
        .build();
      expect(response.body).toEqual(
        Role.restore({ id: newUser.userDb.roleId!, ...newRole })
          .unwrap()
          .toJSON(),
      );
    });
  });
  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
    await mailClient.deleteEmails({ to: adminUser.userDb.email });
  });
});
