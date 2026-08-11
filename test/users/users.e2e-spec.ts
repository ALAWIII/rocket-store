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
import { CUSTOMER_ROLE } from 'src/modules/access-control/application/system-roles/system-roles.definition';
import { UserResponseDto } from 'src/modules/users/dto/user-response.dto';
import { v7 } from 'uuid';

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
    it('should fail when unauthorized user attempts to fetch list of users.', async () => {
      const customer = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole('customer')
        .random()
        .verified()
        .signin()
        .build();
      await customer.userAgent.get('/api/v1/users').expect(403);
    });
    it('should return number of users equal to page and limit', async () => {
      const allUsers: AuthUserResult[] = [adminUser];
      for (let i = 1; i <= 20; i++) {
        allUsers.push(
          await UserAuthFlowBuilder.create({
            dbDataSource: db.dataSource,
            mailhogClient: mailClient,
            userAgent: app.createAgent(),
          })
            .asRole('customer')
            .random()
            .verified()
            .signin()
            .build(),
        );
      }
      const first10Users = (
        await adminUser.userAgent
          .get('/api/v1/users')
          .query({ page: 1, limit: 10 })
          .expect(200)
      ).body as FindUsersResponseDto;
      const second10Users = (
        await adminUser.userAgent
          .get('/api/v1/users')
          .query({ page: 2, limit: 10 })
          .expect(200)
      ).body as FindUsersResponseDto;
      const lastUser = (
        await adminUser.userAgent
          .get('/api/v1/users')
          .query({ page: 3, limit: 10 })
          .expect(200)
      ).body as FindUsersResponseDto;
      const allReturnedUsersIds = [
        ...first10Users.users,
        ...second10Users.users,
        ...lastUser.users,
      ]
        .map((us) => us.id)
        .sort();
      const usersIdsSet = new Set(allReturnedUsersIds);
      expect(allUsers.every((u) => usersIdsSet.has(u.userDb.id))).toBe(true);
      expect(usersIdsSet.size).toBe(21);
      expect(first10Users.users).toHaveLength(10);
      expect(second10Users.users).toHaveLength(10);
      expect(lastUser.users).toHaveLength(1);
      expect(first10Users.total).toBe(21);
      expect(second10Users.total).toBe(21);
      expect(lastUser.total).toBe(21);
    });
    it('should return users based on filter parameters.', async () => {
      const allUsers: AuthUserResult[] = [adminUser];
      for (let i = 1; i <= 20; i++) {
        allUsers.push(
          await UserAuthFlowBuilder.create({
            dbDataSource: db.dataSource,
            mailhogClient: mailClient,
            userAgent: app.createAgent(),
          })
            .asRole('customer')
            .random()
            .verified()
            .signin()
            .build(),
        );
      }
      const workerUser = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole('worker')
        .random()
        .verified()
        .signin()
        .build();
      const usersByRoleId = (
        await adminUser.userAgent
          .get('/api/v1/users')
          .query({ roleId: CUSTOMER_ROLE.id })
          .expect(200)
      ).body as FindUsersResponseDto;
      expect(usersByRoleId.users.length).toBe(20);
      expect(
        // admin and worker users should not be included.
        usersByRoleId.users.some((u) =>
          [adminUser.userDb.id, workerUser.userDb.id].includes(u.id),
        ),
      ).toBe(false);
      expect(
        // only users who have customer roleId are included.
        usersByRoleId.users.every((u) => u.roleId === CUSTOMER_ROLE.id),
      ).toBe(true);

      const usersByEmail = (
        await adminUser.userAgent
          .get('/api/v1/users')
          .query({ email: allUsers[1].userDb.email })
          .expect(200)
      ).body as FindUsersResponseDto;
      expect(usersByEmail.users.length).toBe(1);
      expect(usersByEmail.users[0].id).toEqual(allUsers[1].userDb.id);
    });
    describe('GET /api/v1/users/:id', () => {
      it('should successfully return user profile', async () => {
        const userWorker = await UserAuthFlowBuilder.create({
          dbDataSource: db.dataSource,
          mailhogClient: mailClient,
          userAgent: app.createAgent(),
        })
          .asRole('worker')
          .random()
          .signin()
          .verified()
          .build();
        const userFetched = (
          await adminUser.userAgent
            .get(`/api/v1/users/${userWorker.userDb.id}`)
            .expect(200)
        ).body as UserResponseDto;
        expect(userFetched.id).toEqual(userWorker.userDb.id);
      });
      it('should fail to return not found user.', async () => {
        await adminUser.userAgent.get(`/api/v1/users/${v7()}`).expect(404);
      });
      it('should fail to return a user that is not of the requester permissions scope.', async () => {
        const managerRole = {
          name: 'manager',
          permissions: [AllPermissions.user.UserReadLessOrEqual],
        };
        await adminUser.userAgent
          .post('/api/v1/roles')
          .send(managerRole)
          .expect(201);
        const manager = await UserAuthFlowBuilder.create({
          dbDataSource: db.dataSource,
          mailhogClient: mailClient,
          userAgent: app.createAgent(),
        })
          .asRole('manager')
          .random()
          .verified()
          .signin()
          .build();
        await manager.userAgent
          .get(`/api/v1/users/${adminUser.userDb.id}`)
          .expect(404);
      });
    });
  });

  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
  });
});
