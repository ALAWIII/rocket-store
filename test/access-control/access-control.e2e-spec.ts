import { MailhogClient } from 'mailhog-awesome';
import { TestApp } from '../support/helpers/app-test.helper';
import { TestDatabase } from '../support/helpers/database-test.helper';
import {
  AuthUserResult,
  UserAuthFlowBuilder,
} from '../support/helpers/auth-user-flow.builder';
import { createAuthenticatedTestContext } from '../support/fixtures/create-authenticated-test-context.fixture';
import { SYSTEM_ROLES } from 'src/modules/access-control/application/system-roles/system-roles.definition';
import { AllPermissions } from 'src/modules/access-control/domain/permission';
import { Role } from 'src/modules/access-control/domain/role';
import { RolesControllerTest } from 'test/support/controllers/roles.controller-test';

describe('access-control (e2e)', () => {
  let app: TestApp;
  let db: TestDatabase;
  let mailClient: MailhogClient;
  let adminUser: AuthUserResult;
  let roleController: RolesControllerTest;
  beforeEach(async () => {
    ({ app, db, mailClient, adminUser } =
      await createAuthenticatedTestContext());
    roleController = new RolesControllerTest(adminUser.userAgent);
  });
  describe('GET /api/v1/roles', () => {
    it('should return all roles for admin user.', async () => {
      const response = await roleController.findAll({
        code: 200,
        parseBody: true,
      });
      expect(response.body).toEqual(SYSTEM_ROLES.map((r) => r.toJSON()));
    });
    it('should return all assignable roles only.', async () => {
      const response = await roleController.findAll(
        {
          code: 200,
          parseBody: true,
        },
        'assignable',
      );
      expect(response.body).toEqual(SYSTEM_ROLES.map((r) => r.toJSON()));
    });
    it('should return subset of creatable roles for a user who has the manager role.', async () => {
      const newRole = Role.create({
        name: 'manager',
        permissions: [
          AllPermissions.role.RoleCreateLessOrEqual,
          AllPermissions.address.AddressReadLessOrEqual,
          AllPermissions.role.RoleReadLessOrEqual,
        ],
        createScope: [
          AllPermissions.role.RoleReadLessOrEqual,
          AllPermissions.role.RoleCreateLessOrEqual,
          AllPermissions.address.AddressReadLessOrEqual,
        ],
      })
        .unwrap()
        .toJSON();
      const responseRole = await roleController.create(
        {
          name: newRole.name,
          permissions: newRole.permissions,
          createScope: newRole.createScope,
        },
        {
          code: 201,
          parseBody: true,
        },
      );
      const newManager = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .random()
        .asRole('manager')
        .verified()
        .signin()
        .build();
      const rolesResp = await roleController
        .withAgent(newManager.userAgent)
        .findAll({ code: 200, parseBody: true }, 'creatable');
      expect(rolesResp.body).toEqual([
        ...SYSTEM_ROLES.slice(1).map((r) => r.toJSON()),
        responseRole.body,
      ]);
    });

    it('should return 403 forbidden when an unauthorized user request roles without having roles.read permission.', async () => {
      const customer = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .random()
        .asRole('customer')
        .verified()
        .signin()
        .build();
      await roleController.withAgent(customer.userAgent).findAll({ code: 403 });
    });
  });
  describe('POST /api/v1/roles/policies/reload', () => {
    it('should successfully reload policies in the system internally.', async () => {
      const resp = await roleController.reloadPolicies({
        code: 200,
        parseBody: true,
      });
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
        ]
          .sort((p1, p2) => p1.key().localeCompare(p2.key()))
          .map((p) => p.toJSON()),
        assignScope: [AllPermissions.user.UserReadLessOrEqual.toJSON()],
      };
      const createdRole = (
        await roleController.create(newRole, {
          code: 201,
          parseBody: true,
        })
      ).body!;
      // create a new user and attempt to assign the role to the user.
      const babyUser = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole('babyadmin')
        .random()
        .verified()
        .signin()
        .build();
      expect(createdRole).toEqual({ id: babyUser.userDb.roleId!, ...newRole });
    });
    it('should fail creating new role when assign permission persist without its scope.', async () => {
      const newRole = {
        name: 'babyadmin',
        permissions: [
          AllPermissions.user.UserReadLessOrEqual,
          AllPermissions.role.RoleReadLessOrEqual,
          AllPermissions.role.RoleAssignLessOrEqual,
        ].map((p) => p.toJSON()),
      };
      await roleController.create(newRole, {
        code: 400,
      });
    });
  });
  describe('PUT /api/v1/roles/:id', () => {
    it('should successfully rename non-system role.', async () => {
      const newRole = {
        name: 'manager',
        permissions: [AllPermissions.role.RoleReadLessOrEqual.toJSON()],
      };
      const createdRoleBody = (
        await roleController.create(newRole, {
          code: 201,
          parseBody: true,
        })
      ).body!;

      const renamedRole = (
        await roleController.update(createdRoleBody.id, 'shawarma', {
          code: 200,
          parseBody: true,
        })
      ).body!;

      expect(renamedRole.name).toStrictEqual('shawarma');
      expect(renamedRole.name).not.toStrictEqual('manager');
      expect(renamedRole.id).toStrictEqual(createdRoleBody.id);
    });
    it('should fail to rename non-system role because of unauthorized user.', async () => {
      const newRole = {
        name: 'manager',
        permissions: [AllPermissions.role.RoleReadLessOrEqual.toJSON()],
      };
      const createdRoleBody = (
        await roleController.create(newRole, {
          code: 201,
          parseBody: true,
        })
      ).body!;

      const newUser = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole('customer')
        .random()
        .verified()
        .signin()
        .build();
      await roleController
        .withAgent(newUser.userAgent)
        .update(createdRoleBody.id, 'shawarma', { code: 403 });
    });
    it('should fail to rename admin system role.', async () => {
      await roleController.update(adminUser.userDb.roleId!, 'shawarma', {
        code: 400,
      });
    });
  });
  describe('DELETE /api/v1/roles/:id', () => {
    it('should successfully delete non-system role.', async () => {
      const newRole = {
        name: 'manager',
        permissions: [AllPermissions.role.RoleReadLessOrEqual.toJSON()],
      };
      const createdRoleBody = (
        await roleController.create(newRole, {
          code: 201,
          parseBody: true,
        })
      ).body!;
      const deleted = (
        await roleController.remove(createdRoleBody.id, {
          code: 200,
          parseBody: true,
        })
      ).body!;
      expect(deleted).toStrictEqual({ affected: 1 });
    });
    it('should fail when delete system role.', async () => {
      await roleController.remove(adminUser.userDb.roleId!, {
        code: 403,
      });
    });
    it('should fail when delete role by unauthorized user.', async () => {
      const newRole = {
        name: 'manager',
        permissions: [AllPermissions.role.RoleReadLessOrEqual.toJSON()],
      };
      const createdRoleBody = (
        await roleController.create(newRole, {
          code: 201,
          parseBody: true,
        })
      ).body!;
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
      await roleController
        .withAgent(customer.userAgent)
        .remove(createdRoleBody.id, { code: 403 });
    });
    it('should fail to delete a role its permissions list not subset of the authorized user createScope permission list.', async () => {
      const newRole = {
        name: 'manager',
        permissions: [
          AllPermissions.role.RoleReadLessOrEqual,
          AllPermissions.role.RoleCreateLessOrEqual,
          AllPermissions.role.RoleDeleteLess,
        ].map((p) => p.toJSON()),
        createScope: [AllPermissions.role.RoleReadLessOrEqual.toJSON()],
      };
      const createdManagerRole = (
        await roleController.create(newRole, { code: 201, parseBody: true })
      ).body!;
      const manager = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole(createdManagerRole.name)
        .random()
        .verified()
        .signin()
        .build();
      //======== creating the deletable test role.
      const deleteableRole = {
        name: 'delete',
        permissions: [AllPermissions.user.UserReadLessOrEqual.toJSON()],
      };
      const createdDeletableRole = (
        await roleController.create(deleteableRole, {
          code: 201,
          parseBody: true,
        })
      ).body!;
      const deleteResponseBody = (
        await roleController
          .withAgent(manager.userAgent)
          .remove(createdDeletableRole.id, { code: 200, parseBody: true })
      ).body!;
      expect(deleteResponseBody.affected).toBe(0);
      //============== fetching all roles to see it fails to delete the intended role.
      const roles = (
        await roleController.findAll({ code: 200, parseBody: true })
      ).body!;
      expect(roles.some((r) => r.id === createdDeletableRole.id)).toBe(true);
    });
    it('should fail to delete user requester role.', async () => {
      const newRole = {
        name: 'manager',
        permissions: [
          AllPermissions.role.RoleReadLessOrEqual,
          AllPermissions.role.RoleCreateLessOrEqual,
          AllPermissions.role.RoleDeleteLess,
        ].map((p) => p.toJSON()),
        createScope: [AllPermissions.role.RoleReadLessOrEqual.toJSON()],
      };
      const role = (
        await roleController.create(newRole, { code: 201, parseBody: true })
      ).body!;
      const manager = await UserAuthFlowBuilder.create({
        dbDataSource: db.dataSource,
        mailhogClient: mailClient,
        userAgent: app.createAgent(),
      })
        .asRole(newRole.name)
        .random()
        .verified()
        .signin()
        .build();
      await roleController
        .withAgent(manager.userAgent)
        .remove(role.id, { code: 403 });
    });
  });
  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
  });
});
