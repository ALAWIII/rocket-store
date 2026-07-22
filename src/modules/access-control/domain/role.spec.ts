import { Err } from 'ts-results-es';
import { AllPermissions } from './permission';
import { Role } from './role';
import {
  InvalidPermissionSupersetError,
  InvalidRoleValueError,
} from './role.error';

describe('Role', () => {
  describe('create', () => {
    it('return error for invalid name.', () => {
      const result = Role.create({
        name: 'shawarma_',
        permissions: [],
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidRoleValueError);
        expect(result.error.message).toBe('Invalid name');
      }
    });
    //======================
    it('success create Role that has no special permissions.', () => {
      const permissions = [
        AllPermissions.role.RoleReadAny,
        AllPermissions.role.RoleUpdateOwn,
      ];
      const result = Role.create({
        name: 'hello',
        permissions,
      }).unwrap();
      expect(result.permissions).toEqual(permissions);
    });
    it('success create Role and throw away the duplicated permissions.', () => {
      const permissions = [
        AllPermissions.role.RoleReadAny,
        AllPermissions.role.RoleReadAny,
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
        AllPermissions.role.RoleAssignAny,
        AllPermissions.role.RoleReadAny,
      ];
      const result = Role.create({
        name: 'hello',
        permissions,
        assignScope: [AllPermissions.role.RoleReadAny],
      }).unwrap();
      expect(result.permissions).toEqual(permissions);
      expect(result.permissions.length).toStrictEqual(2);
      expect(result.assignScopePermissions.unwrap()).toEqual([
        AllPermissions.role.RoleReadAny,
      ]);
    });
    it('success create Role with two special permission.', () => {
      const permissions = [
        AllPermissions.role.RoleAssignAny,
        AllPermissions.role.RoleCreateAny,
        AllPermissions.role.RoleReadAny,
      ];
      const result = Role.create({
        name: 'hello',
        permissions,
        assignScope: [AllPermissions.role.RoleReadAny],
        createScope: [AllPermissions.role.RoleReadAny],
      }).unwrap();
      expect(result.permissions).toEqual(permissions);
      expect(result.permissions.length).toStrictEqual(3);
      expect(result.assignScopePermissions.unwrap()).toEqual([
        AllPermissions.role.RoleReadAny,
      ]);
      expect(result.createScopePermissions.unwrap()).toEqual([
        AllPermissions.role.RoleReadAny,
      ]);
    });
    it('should create Role with two special permission and the special permissions are provided in the scopes.', () => {
      const permissions = [
        AllPermissions.role.RoleAssignAny,
        AllPermissions.role.RoleCreateAny,
        AllPermissions.role.RoleReadAny,
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
        AllPermissions.role.RoleAssignAny,
        AllPermissions.role.RoleReadAny,
      ];
      const result = Role.create({
        name: 'hello',
        permissions,
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual(
          new InvalidRoleValueError(
            `assignScope must be provided if and only if its related scoped permission exists.`,
          ),
        );
      }
    });
    it('should fail creating Role when special permission is missing scope permission list is provided.', () => {
      const permissions = [AllPermissions.role.RoleReadAny];
      const result = Role.create({
        name: 'hello',
        permissions,
        assignScope: [AllPermissions.role.RoleReadAny],
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual(
          new InvalidRoleValueError(
            `assignScope must be provided if and only if its related scoped permission exists.`,
          ),
        );
      }
    });
    it('should fail creating Role when special permission and its scope list are provided but the scope list isnt a subset of the role permissions.', () => {
      const permissions = [
        AllPermissions.role.RoleReadAny,
        AllPermissions.role.RoleAssignAny,
      ];
      const result = Role.create({
        name: 'hello',
        permissions,
        assignScope: [
          AllPermissions.role.RoleReadAny,
          AllPermissions.role.RoleUpdateAny,
        ],
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual(
          new InvalidPermissionSupersetError(
            'Main permissions map is not superset of assign scope permissions.',
          ),
        );
      }
    });
  });
});
