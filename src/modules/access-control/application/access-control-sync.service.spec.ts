import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AccessControlSyncService } from './access-control-sync.service';
import { IRoleRepository } from '../infrastructure/repositories/role.repository';
import { AllPermissions, Permission } from '../domain/permission';
import { Role } from '../domain/role';
import { Err, Ok } from 'ts-results-es';
import { IEnforcerHolder } from '../infrastructure/casbin/enforcer-holder';
import * as casbinFactory from '../infrastructure/casbin/casbin.factory';
import { Enforcer } from 'casbin';

function createRole(name: string, permissions: Permission[]): Role {
  return Role.create({ name, permissions }).unwrap();
}

describe('AccessControlSyncService', () => {
  let service: AccessControlSyncService;

  const enforcerHolderMock = {
    set: jest.fn(),
    clearPolicy: jest.fn(),
    addPolicies: jest.fn(),
    getPoliciesById: jest.fn(),
    removePolicies: jest.fn(),
  };

  const roleRepositoryMock = {
    loadAll: jest.fn(),
  };
  const addPoliciesMock = jest.fn() as jest.Mock<
    Promise<boolean>,
    [string[][]]
  >;
  const newEnforcerMock = {
    addPolicies: addPoliciesMock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlSyncService,
        {
          provide: IEnforcerHolder,
          useValue: enforcerHolderMock,
        },
        {
          provide: IRoleRepository,
          useValue: roleRepositoryMock,
        },
      ],
    }).compile();

    service = module.get(AccessControlSyncService);
    const spy = jest.spyOn(casbinFactory, 'createCasbinEnforcer');
    spy.mockResolvedValue(newEnforcerMock as unknown as Enforcer);
  });
  //===================================================
  describe('reloadFromDatabase', () => {
    it('should create new enforcer and call addPolicies to load a list of policies from database to the enforcer.', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
        AllPermissions.role.RoleDeleteOwn,
      ]);
      const workerRole = createRole('worker', [
        AllPermissions.order.OrderViewOwn,
      ]);
      const roles = [adminRole, workerRole];
      //-----------------
      roleRepositoryMock.loadAll.mockResolvedValue(Ok(roles));

      const loggerSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      await service.reloadFromDatabase();

      expect(roleRepositoryMock.loadAll).toHaveBeenCalledTimes(1);
      expect(newEnforcerMock.addPolicies).toHaveBeenCalledTimes(1);
      expect(enforcerHolderMock.set).toHaveBeenCalledWith(newEnforcerMock);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Casbin policies reloaded: 3 policies from 2 roles',
      );

      loggerSpy.mockRestore();
    });

    it('should not call enforcer.addPolicies when there are no policies to load.', async () => {
      const anyrole = createRole('anyrole', []);
      const roles = [anyrole];
      roleRepositoryMock.loadAll.mockResolvedValue(Ok(roles));

      const loggerSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      await service.reloadFromDatabase();

      expect(roleRepositoryMock.loadAll).toHaveBeenCalledTimes(1);
      expect(newEnforcerMock.addPolicies).not.toHaveBeenCalled();
      expect(enforcerHolderMock.set).toHaveBeenCalledWith(newEnforcerMock);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Casbin policies reloaded: 0 policies from 1 roles',
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
      enforcerHolderMock.addPolicies.mockResolvedValue(true);

      await service.reloadFromDatabase();

      expect(newEnforcerMock.addPolicies).toHaveBeenCalledTimes(1);
      expect(newEnforcerMock.addPolicies).toHaveBeenCalledWith([
        // it removes the duplicated permissions when called toPolicies.
        roles[0].toFlatPolicies()[0],
      ]);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('db failed');
      roleRepositoryMock.loadAll.mockReturnValue(Err(error));

      await expect(service.reloadFromDatabase()).rejects.toThrow(error);
      expect(newEnforcerMock.addPolicies).not.toHaveBeenCalled();
      expect(enforcerHolderMock.set).not.toHaveBeenCalled();
    });

    it('should propagate enforcer addPolicies errors', async () => {
      const roles = [createRole('admin', [AllPermissions.role.RoleCreateOwn])];

      roleRepositoryMock.loadAll.mockResolvedValue(Ok(roles));
      newEnforcerMock.addPolicies.mockRejectedValue(new Error('casbin failed'));

      await expect(service.reloadFromDatabase()).rejects.toThrow(
        'casbin failed',
      );
      expect(newEnforcerMock.addPolicies).toHaveBeenCalledTimes(1);
    });
  });
  //===================================================
  describe('removeRole', () => {
    it('should return true and not call removePolicies when role has no policies', async () => {
      enforcerHolderMock.getPoliciesById.mockResolvedValue([]);

      const result = await service.removeRole('admin');

      expect(enforcerHolderMock.getPoliciesById).toHaveBeenCalledTimes(1);
      expect(enforcerHolderMock.getPoliciesById).toHaveBeenCalledWith('admin');
      expect(enforcerHolderMock.removePolicies).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should remove existing policies and return enforcer result', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
        AllPermissions.role.RoleReadOwn,
      ]);

      const existingPolicies = adminRole.toFlatPolicies();

      enforcerHolderMock.getPoliciesById.mockResolvedValue(existingPolicies);
      enforcerHolderMock.removePolicies.mockResolvedValue(true);

      const result = await service.removeRole(adminRole.id);

      expect(enforcerHolderMock.getPoliciesById).toHaveBeenCalledWith(
        adminRole.id,
      );
      expect(enforcerHolderMock.removePolicies).toHaveBeenCalledTimes(1);
      expect(enforcerHolderMock.removePolicies).toHaveBeenCalledWith(
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

      enforcerHolderMock.getPoliciesById.mockResolvedValue(existingPolicies);
      enforcerHolderMock.removePolicies.mockResolvedValue(false);

      const result = await service.removeRole(adminRole.id);

      expect(enforcerHolderMock.removePolicies).toHaveBeenCalledWith(
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

      expect(enforcerHolderMock.addPolicies).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should add policies for role permissions and return enforcer result', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
        AllPermissions.role.RoleReadOwn,
      ]);

      enforcerHolderMock.addPolicies.mockResolvedValue(true);

      const result = await service.addRole(adminRole);

      expect(enforcerHolderMock.addPolicies).toHaveBeenCalledTimes(1);
      expect(enforcerHolderMock.addPolicies).toHaveBeenCalledWith(
        adminRole.toFlatPolicies(),
      );
      expect(result).toBe(true);
    });

    it('should ignore duplicate permissions when adding role', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
        AllPermissions.role.RoleCreateOwn,
      ]);

      enforcerHolderMock.addPolicies.mockResolvedValue(true);

      const result = await service.addRole(adminRole);

      expect(enforcerHolderMock.addPolicies).toHaveBeenCalledWith([
        adminRole.toFlatPolicies()[0],
      ]);
      expect(result).toBe(true);
    });

    it('should return false when enforcer addPolicies returns false', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
      ]);

      enforcerHolderMock.addPolicies.mockResolvedValue(false);

      const result = await service.addRole(adminRole);

      expect(enforcerHolderMock.addPolicies).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });
  });
  //===================================================
  describe('hasRole', () => {
    it('should return true when policies exist for role', async () => {
      const adminRole = createRole('admin', [
        AllPermissions.role.RoleCreateOwn,
      ]);
      enforcerHolderMock.getPoliciesById.mockResolvedValue(
        adminRole.toFlatPolicies(),
      );

      const result = await service.hasRole(adminRole.id);

      expect(enforcerHolderMock.getPoliciesById).toHaveBeenCalledWith(
        adminRole.id,
      );
      expect(result).toBe(true);
    });

    it('should return false when no policies exist for role', async () => {
      enforcerHolderMock.getPoliciesById.mockResolvedValue([]);

      const result = await service.hasRole('admin-role-id');

      expect(enforcerHolderMock.getPoliciesById).toHaveBeenCalledWith(
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
