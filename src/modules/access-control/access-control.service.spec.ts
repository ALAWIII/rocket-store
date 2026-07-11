import { AccessControlService } from './access-control.service';
import { Test, TestingModule } from '@nestjs/testing';
import { IUserRepository } from '../users/infrastructure/repositories/user.repository';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { SystemRolesRegistry } from './application/system-roles.registry';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { Role } from './domain/role';

describe('AccessControlService', () => {
  let service: AccessControlService;
  const userRepoMock = {
    reassignUsersRole: jest.fn(),
  };
  const roleRepoMock = {
    upsert: jest.fn(),
    removeById: jest.fn(),
    update: jest.fn(),
  };
  const systemRoleMock = {
    isSystemRoleName: jest.fn(),
    hasId: jest.fn(),
    getCustomerRoleId: jest.fn(),
  };
  const acsyncServiceMock = { upsertRole: jest.fn(), removeRole: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlService,
        { provide: IUserRepository, useValue: userRepoMock },
        { provide: IRoleRepository, useValue: roleRepoMock },
        { provide: SystemRolesRegistry, useValue: systemRoleMock },
        { provide: AccessControlSyncService, useValue: acsyncServiceMock },
      ],
    }).compile();
    service = module.get(AccessControlService);
    expect(service).toBeDefined();
  });
  describe('createRole', () => {
    it('should return null when attempting to create/update an existing system Role.', async () => {
      const adminRole = { name: 'admin', permissions: [] };
      systemRoleMock.isSystemRoleName.mockReturnValue(true);
      const result = await service.upsertRole(adminRole);
      expect(result).toBeNull();
      expect(systemRoleMock.isSystemRoleName).toHaveBeenCalledTimes(1);
      expect(roleRepoMock.upsert).toHaveBeenCalledTimes(0);
    });
    it('should successfully upsert new role.', async () => {
      const devRoleDto = { name: 'developer', permissions: [] };
      systemRoleMock.isSystemRoleName.mockReturnValue(false);

      roleRepoMock.upsert.mockImplementation((role: Role) => role);

      const role = await service.upsertRole(devRoleDto);

      expect(role).not.toBeNull();
      expect(role).toMatchObject({
        name: devRoleDto.name,
        permissions: devRoleDto.permissions,
      });

      expect(roleRepoMock.upsert).toHaveBeenCalledTimes(1);
      const passedRole = (roleRepoMock.upsert.mock.calls[0] as Role[])[0];
      expect(passedRole).toBeInstanceOf(Role);
      expect(passedRole.name).toBe(devRoleDto.name);
      expect(passedRole.permissions).toEqual(devRoleDto.permissions);

      expect(acsyncServiceMock.upsertRole).toHaveBeenCalledWith(passedRole);
      expect(acsyncServiceMock.upsertRole).toHaveBeenCalledTimes(1);
      expect(systemRoleMock.isSystemRoleName).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateRole', () => {
    it('should return null when attempting to update system Role.', async () => {
      const adminRole = Role.create({ name: 'admin', permissions: [] });
      systemRoleMock.hasId.mockReturnValue(true);
      const role = await service.updateRole(adminRole.id, {
        name: adminRole.name,
        permissions: [],
      });
      expect(role).toBeNull();
      expect(systemRoleMock.hasId).toHaveBeenCalledTimes(1);
      expect(roleRepoMock.update).toHaveBeenCalledTimes(0);
    });
    it('should return role when attempting to update existing one.', async () => {
      const adminRole = Role.create({ name: 'admin', permissions: [] });
      roleRepoMock.update.mockImplementation((adminRole: Role) => adminRole);
      systemRoleMock.hasId.mockReturnValue(false);
      const role = await service.updateRole(adminRole.id, {
        name: adminRole.name,
        permissions: [],
      });
      expect(role).not.toBeNull();
      expect(role).toStrictEqual(adminRole.toJSON());
      expect(systemRoleMock.hasId).toHaveBeenCalledTimes(1);
      expect(roleRepoMock.update).toHaveBeenCalledWith(adminRole);
      expect(roleRepoMock.update).toHaveBeenCalledTimes(1);
      expect(acsyncServiceMock.upsertRole).toHaveBeenCalledWith(adminRole);
    });
  });
  describe('removeRole', () => {
    it('should throw when trying to remove a system role', async () => {
      systemRoleMock.hasId.mockReturnValue(true);

      await expect(service.removeRole('role-id')).rejects.toThrow(
        new Error('System roles cannot be removed'),
      );

      expect(userRepoMock.reassignUsersRole).toHaveBeenCalledTimes(0);
      expect(acsyncServiceMock.removeRole).toHaveBeenCalledTimes(0);
      expect(roleRepoMock.removeById).toHaveBeenCalledTimes(0);
    });
    it('should remove a non-system role successfully', async () => {
      systemRoleMock.hasId.mockReturnValue(false);
      systemRoleMock.getCustomerRoleId.mockReturnValue('customer-id');
      userRepoMock.reassignUsersRole.mockResolvedValue(undefined);
      acsyncServiceMock.removeRole.mockResolvedValue(true);
      roleRepoMock.removeById.mockResolvedValue(1);

      const result = await service.removeRole('role-id');

      expect(result).toBe(1);
      expect(userRepoMock.reassignUsersRole).toHaveBeenCalledWith(
        'role-id',
        'customer-id',
      );
      expect(acsyncServiceMock.removeRole).toHaveBeenCalledWith('role-id');
      expect(roleRepoMock.removeById).toHaveBeenCalledWith('role-id');
    });
    it('should propagate error when reassignUsersRole fails', async () => {
      systemRoleMock.hasId.mockReturnValue(false);
      systemRoleMock.getCustomerRoleId.mockReturnValue('customer-id');
      userRepoMock.reassignUsersRole.mockRejectedValue(new Error('db failed'));

      await expect(service.removeRole('role-id')).rejects.toThrow('db failed');

      expect(acsyncServiceMock.removeRole).toHaveBeenCalledTimes(0);
      expect(roleRepoMock.removeById).toHaveBeenCalledTimes(0);
    });
  });
});
