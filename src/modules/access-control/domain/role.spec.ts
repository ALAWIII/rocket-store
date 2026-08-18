import { AllPermissions } from './permission';
import { Role } from './role';
import { RoleError } from './role.error';

describe('Role', () => {
  describe('create', () => {
    it('return error for invalid name.', () => {
      const result = Role.create({
        name: 'shawarma_',
        permissions: [],
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(RoleError);
        expect(result.error.message).toBe('Invalid name');
      }
    });
    //======================
    it('success create Role that has no special permissions.', () => {
      const permissions = [
        AllPermissions.role.RoleReadLessOrEqual,
        AllPermissions.role.RoleRenameLessOrEqual,
      ];
      const result = Role.create({
        name: 'hello',
        permissions,
      }).unwrap();
      expect(result.permissions).toEqual(permissions);
    });
    it('success create Role and throw away the duplicated permissions.', () => {
      const permissions = [
        AllPermissions.role.RoleReadLessOrEqual,
        AllPermissions.role.RoleReadLessOrEqual,
      ];
      const result = Role.create({
        name: 'hello',
        permissions,
      }).unwrap();
      expect(result.permissions).toEqual([permissions[0]]);
      expect(result.permissions.length).toStrictEqual(1);
    });
    it('success create Role with one special permission.', () => {
      const permissions = [
        AllPermissions.role.RoleAssignLessOrEqual,
        AllPermissions.role.RoleReadLessOrEqual,
      ];
      const result = Role.create({
        name: 'hello',
        permissions,
        assignScope: [AllPermissions.role.RoleReadLessOrEqual],
      }).unwrap();
      expect(result.permissions).toEqual(permissions);
      expect(result.permissions.length).toStrictEqual(2);
      expect(result.assignScopePermissions.unwrap()).toEqual([
        AllPermissions.role.RoleReadLessOrEqual,
      ]);
    });
    it('success create Role with two special permission.', () => {
      const permissions = [
        AllPermissions.role.RoleAssignLessOrEqual,
        AllPermissions.role.RoleCreateLessOrEqual,
        AllPermissions.role.RoleReadLessOrEqual,
      ];
      const result = Role.create({
        name: 'hello',
        permissions,
        assignScope: [AllPermissions.role.RoleReadLessOrEqual],
        createScope: [AllPermissions.role.RoleReadLessOrEqual],
      }).unwrap();
      expect(result.permissions).toEqual(permissions);
      expect(result.permissions.length).toStrictEqual(3);
      expect(result.assignScopePermissions.unwrap()).toEqual([
        AllPermissions.role.RoleReadLessOrEqual,
      ]);
      expect(result.createScopePermissions.unwrap()).toEqual([
        AllPermissions.role.RoleReadLessOrEqual,
      ]);
    });
    it('should create Role with two special permission and the special permissions are provided in the scopes.', () => {
      const permissions = [
        AllPermissions.role.RoleAssignLessOrEqual,
        AllPermissions.role.RoleCreateLessOrEqual,
        AllPermissions.role.RoleReadLessOrEqual,
      ];

      const result = Role.create({
        name: 'hello',
        permissions,
        assignScope: permissions,
        createScope: permissions,
      }).unwrap();
      expect(result.permissions).toEqual(permissions);
      expect(result.permissions.length).toStrictEqual(3);
      expect(result.createScopePermissions.unwrap().length).toStrictEqual(3);
      expect(result.createScopePermissions.unwrap().length).toStrictEqual(3);
      expect(result.assignScopePermissions.unwrap()).toEqual(permissions);
      expect(result.assignScopePermissions.unwrap()).toEqual(permissions);
    });
    //=====================================
    it('should fail creating Role when special permission is provided and scope permission list is undefined.', () => {
      const permissions = [
        AllPermissions.role.RoleAssignLessOrEqual,
        AllPermissions.role.RoleReadLessOrEqual,
      ];
      const result = Role.create({
        name: 'hello',
        permissions,
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual(
          new RoleError(
            `assignScope must be provided if and only if its related scoped permission exists.`,
          ),
        );
      }
    });
    it('should fail creating Role when special permission is missing scope permission list is provided.', () => {
      const permissions = [AllPermissions.role.RoleReadLessOrEqual];
      const result = Role.create({
        name: 'hello',
        permissions,
        assignScope: [AllPermissions.role.RoleReadLessOrEqual],
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual(
          new RoleError(
            `assignScope must be provided if and only if its related scoped permission exists.`,
          ),
        );
      }
    });
    it('should fail creating Role when special permission and its scope list are provided but the scope list isnt a subset of the role permissions.', () => {
      const permissions = [
        AllPermissions.role.RoleReadLessOrEqual,
        AllPermissions.role.RoleAssignLessOrEqual,
      ];
      const result = Role.create({
        name: 'hello',
        permissions,
        assignScope: [
          AllPermissions.role.RoleReadLessOrEqual,
          AllPermissions.role.RoleRenameLessOrEqual,
        ],
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual(
          new RoleError(
            'Main permissions map is not superset of assign scope permissions.',
          ),
        );
      }
    });
  });
});
