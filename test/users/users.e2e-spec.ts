import { MailhogClient } from 'mailhog-awesome';
import { TestApp } from '../support/helpers/app-test.helper';
import { TestDatabase } from '../support/helpers/database-test.helper';
import {
  AuthUserResult,
  UserAuthFlowBuilder,
} from '../support/helpers/auth-user-flow.builder';
import { createAuthenticatedTestContext } from '../support/fixtures/create-authenticated-test-context.fixture';
import { AllPermissions } from 'src/modules/access-control/domain/permission';
import {
  ADMIN_ROLE,
  CUSTOMER_ROLE,
  WORKER_ROLE,
} from 'src/modules/access-control/application/system-roles/system-roles.definition';
import { v7 } from 'uuid';
import { UsersControllerTest } from 'test/support/controllers/users/users.controller-test';
import { RolesControllerTest } from 'test/support/controllers/roles.controller-test';
import { UpdateUserTestDto } from 'test/support/types/user/update-user.dto.type';

describe('users (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  let mailClient: MailhogClient;
  let adminUser: AuthUserResult;
  let userController: UsersControllerTest;
  let roleController: RolesControllerTest;
  beforeEach(async () => {
    ({ app, db, mailClient, adminUser } =
      await createAuthenticatedTestContext());
    userController = new UsersControllerTest(adminUser.userAgent);
    roleController = new RolesControllerTest(adminUser.userAgent);
  });
  describe('GET /api/v1/users/me (findMe)', () => {
    it('should return user profile.', async () => {
      const userResp = await userController.findMe({
        code: 200,
        parseBody: true,
      });
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
  describe('GET /api/v1/users (findAll)', () => {
    it('should return all users whose permissions are a subset of the requester permissions.', async () => {
      const managerRole = {
        name: 'manager',
        permissions: [
          AllPermissions.address.AddressReadLessOrEqual,
          AllPermissions.user.UserReadLessOrEqual,
        ],
      };
      await roleController.create(managerRole, { code: 201, parseBody: true });

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
        await userController
          .withAgent(expectedUsers[0].userAgent)
          .findAll({ code: 200, parseBody: true })
      ).body!;
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
      await userController.withAgent(customer.userAgent).findAll({ code: 403 });
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
        await userController.findAll(
          { code: 200, parseBody: true },
          { page: 1, limit: 10 },
        )
      ).body!;
      const second10Users = (
        await userController.findAll(
          { code: 200, parseBody: true },
          { page: 2, limit: 10 },
        )
      ).body!;
      const lastUser = (
        await userController.findAll(
          { code: 200, parseBody: true },
          { page: 3, limit: 10 },
        )
      ).body!;
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
        await userController.findAll(
          { code: 200, parseBody: true },
          { roleId: CUSTOMER_ROLE.id },
        )
      ).body!;
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
        await userController.findAll(
          { code: 200, parseBody: true },
          { email: allUsers[1].userDb.email },
        )
      ).body!;
      expect(usersByEmail.users.length).toBe(1);
      expect(usersByEmail.users[0].id).toEqual(allUsers[1].userDb.id);
    });
    describe('GET /api/v1/users/:id (findById)', () => {
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
          await userController.findById(userWorker.userDb.id, {
            code: 200,
            parseBody: true,
          })
        ).body!;
        expect(userFetched.id).toEqual(userWorker.userDb.id);
      });
      it('should fail to return not found user.', async () => {
        await userController.findById(v7(), { code: 404 });
      });
      it('should fail to return a user that is not of the requester permissions scope.', async () => {
        const managerRole = {
          name: 'manager',
          permissions: [AllPermissions.user.UserReadLessOrEqual.toJSON()],
        };
        await roleController.create(managerRole, { code: 201 });
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

        await userController
          .withAgent(manager.userAgent)
          .findById(adminUser.userDb.id, { code: 404 });
      });
    });
    describe('PATCH /api/v1/users/me (updateMe)', () => {
      it('should successfully update user profile', async () => {
        const userProfile: UpdateUserTestDto = {
          name: 'cat',
          givenName: 'lion',
          familyName: 'tigers',
          image: 'http://puppy.com',
          phone: '+19363463473',
        };
        const updateResp = await userController
          .withAgent(adminUser.userAgent)
          .updateMe(userProfile, {
            code: 200,
            parseBody: true,
          });
        const getUpdatedProfile = (
          await userController.findMe({
            code: 200,
            parseBody: true,
          })
        ).body!;
        expect(updateResp.body!).toEqual(getUpdatedProfile);
      });
      it('should fail update user profile because of malformed phone number', async () => {
        const userProfile: UpdateUserTestDto = {
          phone: '9363463473',
        };
        const errorMessage = (
          await userController
            .withAgent(adminUser.userAgent)
            .updateMe(userProfile, {
              code: 400,
              parseBody: false,
            })
        ).response.body as { message: string[] };
        expect(errorMessage.message).toEqual([
          'phone must be a valid E.164 phone number',
        ]);
      });
      it('should fail update user profile when sending empty object.', async () => {
        const errorMessage = (
          await userController.withAgent(adminUser.userAgent).updateMe(
            {},
            {
              code: 400,
              parseBody: false,
            },
          )
        ).response.body as { message: string[] };
        expect(errorMessage.message).toEqual([
          'At least one field must be provided',
        ]);
      });
    });
    describe('PATCH /api/v1/users/:id/role (assignRole)', () => {
      it('should successfully assign new role to user.', async () => {
        const customer = await UserAuthFlowBuilder.create({
          dbDataSource: db.dataSource,
          mailhogClient: mailClient,
          userAgent: app.createAgent(),
        })
          .asRole('customer')
          .random()
          .signin()
          .verified()
          .build();
        const assignedUser = await userController.assignRole(
          customer.userDb.id,
          WORKER_ROLE.id,
          { code: 200, parseBody: true },
        );

        expect({
          userId: assignedUser.body!.id,
          roleId: assignedUser.body?.roleId,
        }).toEqual({
          userId: customer.userDb.id,
          roleId: WORKER_ROLE.id,
        });
      });
      it('should fail when unauthorized user request to assign role to user.', async () => {
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
        await userController
          .withAgent(customer.userAgent)
          .assignRole(adminUser.userDb.id, WORKER_ROLE.id, { code: 403 });
      });
      it('should fail when authorized user request to assign role and this role is not of user requester scope.', async () => {
        const newRole = {
          name: 'manager',
          permissions: [AllPermissions.role.RoleAssignLessOrEqual],
          assignScope: [AllPermissions.user.UserReadLessOrEqual],
        };
        const createdMRole = await roleController.create(newRole, {
          code: 201,
          parseBody: true,
        });
        const manager = await UserAuthFlowBuilder.create({
          dbDataSource: db.dataSource,
          mailhogClient: mailClient,
          userAgent: app.createAgent(),
        })
          .asRole(createdMRole.body!.name)
          .random()
          .signin()
          .verified()
          .build();
        const customer = await UserAuthFlowBuilder.create({
          dbDataSource: db.dataSource,
          mailhogClient: mailClient,
          userAgent: app.createAgent(),
        })
          .asRole('customer')
          .random()
          .signin()
          .verified()
          .build();
        await userController
          .withAgent(manager.userAgent)
          .assignRole(customer.userDb.id, ADMIN_ROLE.id, { code: 404 });
      });
    });
  });

  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
  });
});
