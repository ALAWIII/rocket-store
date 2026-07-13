import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AccessControlSyncService } from './access-control-sync.service';
import { AUTHZ_ENFORCER } from 'nest-authz';
import { IRoleRepository } from '../infrastructure/repositories/role.repository';
import { AllPermissions, Permission } from '../domain/permission';
import { Role } from '../domain/role';
import { Err, Ok } from 'ts-results-es';

function createRole(name: string, permissions: Permission[]): Role {
  return Role.create({ name, permissions }).unwrap();
}

describe('AccessControlSyncService', () => {
  let service: AccessControlSyncService;

  const enforcerMock = {
    clearPolicy: jest.fn(),
    addPolicies: jest.fn(),
    getFilteredPolicy: jest.fn(),
    removePolicies: jest.fn(),
  };

  const roleRepositoryMock = {
    loadAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlSyncService,
        {
          provide: AUTHZ_ENFORCER,
          useValue: enforcerMock,
        },
        {
          provide: IRoleRepository,
          useValue: roleRepositoryMock,
        },
      ],
    }).compile();

    service = module.get(AccessControlSyncService);
  });
  //===================================================
  describe('reloadFromDatabase', () => {
    it('should clear current policies and add reloaded policies from database', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
        AllPermissions.role.RoleDeleteOwn,
      ]);
      const workerRole = createRole('worker', [
        AllPermissions.order.OrderViewOwn,
      ]);
      const roles = [adminRole, workerRole];
      roleRepositoryMock.loadAll.mockResolvedValue(Ok(roles));
      enforcerMock.addPolicies.mockResolvedValue(true);

      const loggerSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      await service.reloadFromDatabase();

      expect(roleRepositoryMock.loadAll).toHaveBeenCalledTimes(1);
      expect(enforcerMock.clearPolicy).toHaveBeenCalledTimes(1);
      expect(enforcerMock.addPolicies).toHaveBeenCalledTimes(1);
      expect(enforcerMock.addPolicies).toHaveBeenCalledWith([
        ...adminRole.toFlatPolicies(),
        ...workerRole.toFlatPolicies(),
      ]);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Casbin policies reloaded: 3 policies from 2 roles',
      );

      loggerSpy.mockRestore();
    });

    it('should clear current policies and not call addPolicies when there are no policies', async () => {
      const adminRole = createRole('admin', []);
      const workerRole = createRole('worker', []);
      const roles = [adminRole, workerRole];
      roleRepositoryMock.loadAll.mockResolvedValue(Ok(roles));

      const loggerSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      await service.reloadFromDatabase();

      expect(roleRepositoryMock.loadAll).toHaveBeenCalledTimes(1);
      expect(enforcerMock.clearPolicy).toHaveBeenCalledTimes(1);
      expect(enforcerMock.addPolicies).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        'Casbin policies reloaded: 0 policies from 2 roles',
      );

      loggerSpy.mockRestore();
    });

    it('should ignore duplicated policies while reloading', async () => {
      const duplicatePermissionA = AllPermissions.role.RoleCreateOwn;
      const duplicatePermissionB = AllPermissions.role.RoleCreateOwn;

      const roles = [
        createRole('admin', [duplicatePermissionA, duplicatePermissionB]),
      ];

      roleRepositoryMock.loadAll.mockResolvedValue(Ok(roles));
      enforcerMock.addPolicies.mockResolvedValue(true);

      await service.reloadFromDatabase();

      expect(enforcerMock.clearPolicy).toHaveBeenCalledTimes(1);
      expect(enforcerMock.addPolicies).toHaveBeenCalledTimes(1);
      expect(enforcerMock.addPolicies).toHaveBeenCalledWith([
        // it removes the duplicated permissions when called toPolicies.
        roles[0].toFlatPolicies()[0],
      ]);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('db failed');
      roleRepositoryMock.loadAll.mockReturnValue(Err(error));

      await expect(service.reloadFromDatabase()).rejects.toThrow(error);
      expect(enforcerMock.clearPolicy).not.toHaveBeenCalled();
      expect(enforcerMock.addPolicies).not.toHaveBeenCalled();
    });

    it('should propagate enforcer addPolicies errors', async () => {
      const roles = [createRole('admin', [AllPermissions.role.RoleCreateOwn])];

      roleRepositoryMock.loadAll.mockResolvedValue(Ok(roles));
      enforcerMock.addPolicies.mockRejectedValue(new Error('casbin failed'));

      await expect(service.reloadFromDatabase()).rejects.toThrow(
        'casbin failed',
      );
      expect(enforcerMock.clearPolicy).toHaveBeenCalledTimes(1);
      expect(enforcerMock.addPolicies).toHaveBeenCalledTimes(1);
    });
  });
  //===================================================
  describe('removeRole', () => {
    it('should return true and not call removePolicies when role has no policies', async () => {
      enforcerMock.getFilteredPolicy.mockResolvedValue([]);

      const result = await service.removeRole('admin');

      expect(enforcerMock.getFilteredPolicy).toHaveBeenCalledTimes(1);
      expect(enforcerMock.getFilteredPolicy).toHaveBeenCalledWith(0, 'admin');
      expect(enforcerMock.removePolicies).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should remove existing policies and return enforcer result', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
        AllPermissions.role.RoleReadOwn,
      ]);

      const existingPolicies = adminRole.toFlatPolicies();

      enforcerMock.getFilteredPolicy.mockResolvedValue(existingPolicies);
      enforcerMock.removePolicies.mockResolvedValue(true);

      const result = await service.removeRole(adminRole.id);

      expect(enforcerMock.getFilteredPolicy).toHaveBeenCalledWith(
        0,
        adminRole.id,
      );
      expect(enforcerMock.removePolicies).toHaveBeenCalledTimes(1);
      expect(enforcerMock.removePolicies).toHaveBeenCalledWith(
        existingPolicies,
      );
      expect(result).toBe(true);
    });

    it('should return false when enforcer removePolicies returns false', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
        AllPermissions.role.RoleReadOwn,
      ]);

      const existingPolicies = adminRole.toFlatPolicies();

      enforcerMock.getFilteredPolicy.mockResolvedValue(existingPolicies);
      enforcerMock.removePolicies.mockResolvedValue(false);

      const result = await service.removeRole(adminRole.id);

      expect(enforcerMock.removePolicies).toHaveBeenCalledWith(
        existingPolicies,
      );
      expect(result).toBe(false);
    });
  });
  //===================================================
  describe('addRole', () => {
    it('should return true and not call addPolicies when role has no permissions', async () => {
      const adminRole = createRole('admin', []);

      const result = await service.addRole(adminRole);

      expect(enforcerMock.addPolicies).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should add policies for role permissions and return enforcer result', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
        AllPermissions.role.RoleReadOwn,
      ]);

      enforcerMock.addPolicies.mockResolvedValue(true);

      const result = await service.addRole(adminRole);

      expect(enforcerMock.addPolicies).toHaveBeenCalledTimes(1);
      expect(enforcerMock.addPolicies).toHaveBeenCalledWith(
        adminRole.toFlatPolicies(),
      );
      expect(result).toBe(true);
    });

    it('should ignore duplicate permissions when adding role', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
        AllPermissions.role.RoleCreateOwn,
      ]);

      enforcerMock.addPolicies.mockResolvedValue(true);

      const result = await service.addRole(adminRole);

      expect(enforcerMock.addPolicies).toHaveBeenCalledWith([
        adminRole.toFlatPolicies()[0],
      ]);
      expect(result).toBe(true);
    });

    it('should return false when enforcer addPolicies returns false', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
      ]);

      enforcerMock.addPolicies.mockResolvedValue(false);

      const result = await service.addRole(adminRole);

      expect(enforcerMock.addPolicies).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });
  });
  //===================================================
  describe('hasRole', () => {
    it('should return true when policies exist for role', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
      ]);
      enforcerMock.getFilteredPolicy.mockResolvedValue(
        adminRole.toFlatPolicies(),
      );

      const result = await service.hasRole(adminRole.id);

      expect(enforcerMock.getFilteredPolicy).toHaveBeenCalledWith(
        0,
        adminRole.id,
      );
      expect(result).toBe(true);
    });

    it('should return false when no policies exist for role', async () => {
      enforcerMock.getFilteredPolicy.mockResolvedValue([]);

      const result = await service.hasRole('admin-role-id');

      expect(enforcerMock.getFilteredPolicy).toHaveBeenCalledWith(
        0,
        'admin-role-id',
      );
      expect(result).toBe(false);
    });
  });
  //===================================================
  describe('upsertRole', () => {
    it('should remove then add role policies successfully', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
      ]);

      const removeRoleSpy = jest
        .spyOn(service, 'removeRole')
        .mockResolvedValue(true);
      const addRoleSpy = jest.spyOn(service, 'addRole').mockResolvedValue(true);

      await expect(service.upsertRole(adminRole)).resolves.toBeUndefined();

      expect(removeRoleSpy).toHaveBeenCalledTimes(1);
      expect(removeRoleSpy).toHaveBeenCalledWith(adminRole.id);
      expect(addRoleSpy).toHaveBeenCalledTimes(1);
      expect(addRoleSpy).toHaveBeenCalledWith(adminRole);

      expect(removeRoleSpy.mock.invocationCallOrder[0]).toBeLessThan(
        addRoleSpy.mock.invocationCallOrder[0],
      );
    });

    it('should throw when addRole returns false', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
      ]);

      jest.spyOn(service, 'removeRole').mockResolvedValue(true);
      jest.spyOn(service, 'addRole').mockResolvedValue(false);

      await expect(service.upsertRole(adminRole)).rejects.toThrow(
        `Failed adding Casbin policies for role ${adminRole.id}`,
      );
    });

    it('should propagate removeRole errors', async () => {
      const workerRole = createRole('worker', [
        AllPermissions.role.RoleCreateOwn,
      ]);

      jest
        .spyOn(service, 'removeRole')
        .mockRejectedValue(new Error('remove failed'));

      await expect(service.upsertRole(workerRole)).rejects.toThrow(
        'remove failed',
      );
    });

    it('should propagate addRole errors', async () => {
      const workerRole = createRole('worker', [
        AllPermissions.role.RoleCreateOwn,
      ]);
      jest.spyOn(service, 'removeRole').mockResolvedValue(true);
      jest.spyOn(service, 'addRole').mockRejectedValue(new Error('add failed'));

      await expect(service.upsertRole(workerRole)).rejects.toThrow(
        'add failed',
      );
    });
  });
});
