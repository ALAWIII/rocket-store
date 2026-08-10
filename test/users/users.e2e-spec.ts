import { MailhogClient } from 'mailhog-awesome';
import { TestApp } from '../support/helpers/app-test.helper';
import { TestDatabase } from '../support/helpers/database-test.helper';
import {
  AuthUserResult,
  UserAuthFlowBuilder,
} from '../support/helpers/auth-user-flow.builder';
import { createAuthenticatedTestContext } from '../support/fixtures/create-authenticated-test-context.fixture';
import { AllPermissions } from 'src/modules/access-control/domain/permission';
import { RoleResponseDto } from 'src/modules/access-control/dto/role-response.dto';
import { FindUsersResponseDto } from 'src/modules/users/dto/find-users-response.dto';

describe('users (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  let mailClient: MailhogClient;
  let adminUser: AuthUserResult;
  beforeEach(async () => {
    ({ app, db, mailClient, adminUser } =
      await createAuthenticatedTestContext());
  });
  describe('GET /api/v1/users/me (findMe)', () => {
    it('should return user profile.', async () => {
      const userResp = await adminUser.userAgent
        .get('/api/v1/users/me')
        .expect(200);
      expect(userResp.body).toEqual({
        id: adminUser.userDb.id,
        name: adminUser.userDb.name,
        email: adminUser.userDb.email,
        roleId: adminUser.userDb.roleId,
        createdAt: adminUser.userDb.createdAt,
        updatedAt: adminUser.userDb.updatedAt,
      });
    });
  });
  describe('GET /api/v1/users', () => {
    it('should return all users whose permissions are a subset of the requester permissions.', async () => {
      const managerRole = {
        name: 'manager',
        permissions: [
          AllPermissions.user.UserReadLessOrEqual,
          AllPermissions.address.AddressReadLessOrEqual,
        ],
      };
      const managerRoleResp = (
        await adminUser.userAgent
          .post('/api/v1/roles')
          .send(managerRole)
          .expect(201)
      ).body as RoleResponseDto;
      const rolesName = ['manager', 'worker', 'customer'];
      const expectedUsers: AuthUserResult[] = [];
      for (const nm of rolesName) {
        expectedUsers.push(
          await UserAuthFlowBuilder.create({
            dbDataSource: db.dataSource,
            mailhogClient: mailClient,
            userAgent: app.createAgent(),
          })
            .asRole(nm)
            .random()
            .verified()
            .signin()
            .build(),
        );
      }
      const managerRequestUsersList = (
        await expectedUsers[0].userAgent.get('/api/v1/users').expect(200)
      ).body as FindUsersResponseDto;
      const returndUserIds = managerRequestUsersList.users
        .map((user) => user.id)
        .sort();
      expect(returndUserIds).toEqual(
        expectedUsers.map((u) => u.userDb.id).sort(),
      );

      expect(managerRequestUsersList.total).toStrictEqual(3);
      expect(returndUserIds).not.toContain(adminUser.userDb.id);
    });
  });

  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
  });
});
