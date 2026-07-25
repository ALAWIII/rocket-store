import { AccessControlService } from './access-control.service';
import { Test, TestingModule } from '@nestjs/testing';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { SystemRolesRegistry } from './application/system-roles.registry';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { Role } from './domain/role';
import { Ok } from 'ts-results-es';
import { AllPermissions, Permission } from './domain/permission';

describe('AccessControlService', () => {
  let service: AccessControlService;

  const roleRepoMock = {
    create: jest.fn(),
    removeById: jest.fn(),
    rename: jest.fn(),
  };
  const systemRoleMock = {
    isSystemRoleName: jest.fn(),
    hasId: jest.fn(),
    getCustomerRoleId: jest.fn(),
  };
  const acsyncServiceMock = {
    upsertRole: jest.fn(),
    removeRole: jest.fn(),
    getPermissions: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlService,
        { provide: IRoleRepository, useValue: roleRepoMock },
        { provide: SystemRolesRegistry, useValue: systemRoleMock },
        { provide: AccessControlSyncService, useValue: acsyncServiceMock },
      ],
    }).compile();
    service = module.get(AccessControlService);
    expect(service).toBeDefined();
  });
  describe('createRole', () => {
    it('should throw error when attempting to create an existing system Role.', async () => {
      const adminRole = { name: 'admin', permissions: [] };
      systemRoleMock.isSystemRoleName.mockReturnValue(true);

      await expect(
        service.createRole('not-important', adminRole),
      ).rejects.toThrow('Try to create an existing system role.');
      expect(systemRoleMock.isSystemRoleName).toHaveBeenCalledTimes(1);
      expect(roleRepoMock.create).toHaveBeenCalledTimes(0);
    });

    it('should successfully upsert new role.', async () => {
      const devRoleDto = { name: 'developer', permissions: [] };

      systemRoleMock.isSystemRoleName.mockReturnValue(false);
      roleRepoMock.create.mockImplementation((role: Role) => Ok(role));

      const role = await service.createRole('roleId', devRoleDto);

      expect(role).toMatchObject({
        name: devRoleDto.name,
        permissions: devRoleDto.permissions,
      });

      expect(roleRepoMock.create).toHaveBeenCalledTimes(1);
      const passedRole = (roleRepoMock.create.mock.calls[0] as Role[])[0];
      expect(passedRole).toBeInstanceOf(Role);
      expect(passedRole.name).toBe(devRoleDto.name);
      expect(passedRole.permissions).toEqual(devRoleDto.permissions);

      expect(acsyncServiceMock.upsertRole).toHaveBeenCalledWith(passedRole);
      expect(acsyncServiceMock.upsertRole).toHaveBeenCalledTimes(1);
      expect(systemRoleMock.isSystemRoleName).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateRole', () => {
    it('should throw error when attempting to update system Role.', async () => {
      const adminRole = Role.create({
        name: 'admin',
        permissions: [],
      }).unwrap();
      systemRoleMock.hasId.mockReturnValue(true);
      const role = service.renameRole('not-important', adminRole.id, {
        name: adminRole.name,
      });
      await expect(role).rejects.toThrow(
        'Try to update an existing System Role.',
      );
      expect(systemRoleMock.hasId).toHaveBeenCalledTimes(1);
      expect(roleRepoMock.rename).toHaveBeenCalledTimes(0);
    });
    it('should return role when attempting to update existing one.', async () => {
      const worker2Role = Role.create({
        name: 'workerx',
        permissions: [AllPermissions.role.RoleCreateLessOrEqual],
      }).unwrap();
      const userPermissions = new Map<string, Permission>([
        [
          AllPermissions.role.RoleCreateLessOrEqual.key(),
          AllPermissions.role.RoleCreateLessOrEqual,
        ],
      ]);
      acsyncServiceMock.getPermissions.mockReturnValue(userPermissions);
      roleRepoMock.rename.mockImplementation((worker2Role: Role) =>
        Ok(worker2Role),
      );
      systemRoleMock.hasId.mockReturnValue(false);
      const role = await service.renameRole('roleId', worker2Role.id, {
        name: worker2Role.name,
      });
      expect(role).toStrictEqual(worker2Role.toJSON());
      expect(systemRoleMock.hasId).toHaveBeenCalledTimes(1);
      expect(roleRepoMock.rename).toHaveBeenCalledWith(worker2Role);
      expect(roleRepoMock.rename).toHaveBeenCalledTimes(1);
      expect(acsyncServiceMock.upsertRole).toHaveBeenCalledWith(worker2Role);
    });
  });
  describe('removeRole', () => {
    it('should throw when trying to remove a system role', async () => {
      systemRoleMock.hasId.mockReturnValue(true);

      await expect(
        service.removeRole('user-role-id', 'role-id'),
      ).rejects.toThrow(new Error('System roles cannot be removed'));

      expect(acsyncServiceMock.removeRole).toHaveBeenCalledTimes(0);
      expect(roleRepoMock.removeById).toHaveBeenCalledTimes(0);
    });
    it('should remove a non-system role successfully', async () => {
      systemRoleMock.hasId.mockReturnValue(false);
      systemRoleMock.getCustomerRoleId.mockReturnValue('customer-id');
      acsyncServiceMock.removeRole.mockResolvedValue(true);
      roleRepoMock.removeById.mockResolvedValue(Ok(1));

      const result = await service.removeRole('user-role-id', 'role-id');

      expect(result).toBe(1);

      expect(acsyncServiceMock.removeRole).toHaveBeenCalledWith('role-id');
      expect(roleRepoMock.removeById).toHaveBeenCalledWith('role-id');
    });
    it('should propagate error when reassignUsersRole fails', async () => {
      systemRoleMock.hasId.mockReturnValue(false);
      systemRoleMock.getCustomerRoleId.mockReturnValue('customer-id');

      await expect(
        service.removeRole('user-role-id', 'role-id'),
      ).rejects.toThrow('db failed');

      expect(acsyncServiceMock.removeRole).toHaveBeenCalledTimes(0);
      expect(roleRepoMock.removeById).toHaveBeenCalledTimes(0);
    });
  });
});
