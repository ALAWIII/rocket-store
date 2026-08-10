import { MailhogClient } from 'mailhog-awesome';
import { TestApp } from './helpers/app-test.helper';
import { TestDatabase } from './helpers/database-test.helper';
import {
  AuthUserResult,
  UserAuthFlowBuilder,
} from './helpers/auth-user-flow.builder';
import { createAuthenticatedTestContext } from './fixtures/create-authenticated-test-context.fixture';
import { SYSTEM_ROLES } from 'src/modules/access-control/application/system-roles/system-roles.definition';
import { AllPermissions } from 'src/modules/access-control/domain/permission';
import { Role } from 'src/modules/access-control/domain/role';
type PermissionDto = { entity: string; visibility: string; action: string };
type RoleDto = {
  id: string;
  name: string;
  permission: PermissionDto[];
  assignScope?: PermissionDto[];
  createScope?: PermissionDto[];
};
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
      const response = await adminUser.userAgent
        .get('/api/v1/roles?scope=assignable')
        .expect(200);
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
      const responseRole = await adminUser.userAgent
        .post('/api/v1/roles')
        .send({
          name: newRole.name,
          permissions: newRole.permissions,
          createScope: newRole.createScope,
        })
        .expect(201);
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
      const rolesResp = await newManager.userAgent
        .get('/api/v1/roles?scope=creatable')
        .expect(200);
      expect(rolesResp.body).toEqual([
        ...SYSTEM_ROLES.slice(1).map((r) => r.toJSON()),
        responseRole.body,
      ]);
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
    it('should fail creating new role when assign permission persist without its scope.', async () => {
      const newRole = {
        name: 'babyadmin',
        permissions: [
          AllPermissions.user.UserReadLessOrEqual,
          AllPermissions.role.RoleReadLessOrEqual,
          AllPermissions.role.RoleAssignLessOrEqual,
        ],
      };
      const response = await adminUser.userAgent
        .post('/api/v1/roles')
        .send(newRole)
        .expect(400);
    });
  });
  describe('PUT /api/v1/roles/:id', () => {
    it('should successfully rename non-system role.', async () => {
      const newRole = {
        name: 'manager',
        permissions: [AllPermissions.role.RoleReadLessOrEqual.toJSON()],
      };
      const responseRole = (
        await adminUser.userAgent
          .post('/api/v1/roles')
          .send(newRole)
          .expect(201)
      ).body as RoleDto;

      const renamedRole = (
        await adminUser.userAgent
          .put(`/api/v1/roles/${responseRole.id}`)
          .send({ name: 'shawarma' })
          .expect(200)
      ).body as RoleDto;
      expect(renamedRole.name).toStrictEqual('shawarma');
      expect(renamedRole.name).not.toStrictEqual('manager');
      expect(renamedRole.id).toStrictEqual(responseRole.id);
    });
    it('should fail to rename non-system role because of unauthorized user.', async () => {
      const newRole = {
        name: 'manager',
        permissions: [AllPermissions.role.RoleReadLessOrEqual.toJSON()],
      };
      const responseRole = (
        await adminUser.userAgent
          .post('/api/v1/roles')
          .send(newRole)
          .expect(201)
      ).body as RoleDto;

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
      const renamedRole = await newUser.userAgent
        .put(`/api/v1/roles/${responseRole.id}`)
        .send({ name: 'shawarma' })
        .expect(403);
    });
    it('should fail to rename admin system role.', async () => {
      const renamedRole = await adminUser.userAgent
        .put(`/api/v1/roles/${adminUser.userDb.roleId}`)
        .send({ name: 'shawarma' })
        .expect(400);
    });
  });
  describe('DELETE /api/v1/roles/:id', () => {
    it('should successfully delete non-system role.', async () => {
      const newRole = {
        name: 'manager',
        permissions: [AllPermissions.role.RoleReadLessOrEqual.toJSON()],
      };
      const responseRole = (
        await adminUser.userAgent
          .post('/api/v1/roles')
          .send(newRole)
          .expect(201)
      ).body as RoleDto;
      const deleted = await adminUser.userAgent
        .delete(`/api/v1/roles/${responseRole.id}`)
        .expect(200);
      expect(deleted.body).toStrictEqual({ affected: 1 });
    });
    it('should fail when delete system role.', async () => {
      const deleted = await adminUser.userAgent
        .delete(`/api/v1/roles/${adminUser.userDb.roleId}`)
        .expect(403);
    });
  });
  afterEach(async () => {
    await db.cleanup();
    await app.cleanup();
  });
});
