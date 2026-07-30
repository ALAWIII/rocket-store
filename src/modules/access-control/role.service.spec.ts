import { RoleService } from './role.service';
import { Test, TestingModule } from '@nestjs/testing';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { SystemRolesRegistry } from './application/system-roles/system-roles.registry';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { Role } from './domain/role';
import { Ok } from 'ts-results-es';

describe('AccessControlService', () => {
  let service: RoleService;

  const roleRepoMock = {
    create: jest.fn(),
    deleteById: jest.fn(),
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
        RoleService,
        { provide: IRoleRepository, useValue: roleRepoMock },
        { provide: SystemRolesRegistry, useValue: systemRoleMock },
        { provide: AccessControlSyncService, useValue: acsyncServiceMock },
      ],
    }).compile();
    service = module.get(RoleService);
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
  describe('renameRole', () => {
    it('should throw error when attempting to rename system Role.', async () => {
      const adminRole = Role.create({
        name: 'admin',
        permissions: [],
      }).unwrap();
      systemRoleMock.hasId.mockReturnValue(true);
      const role = service.renameRole('not-important', adminRole.id, {
        name: adminRole.name,
      });
      await expect(role).rejects.toThrow(
        'Try to rename an existing System Role.',
      );
      expect(systemRoleMock.hasId).toHaveBeenCalledTimes(1);
      expect(roleRepoMock.rename).toHaveBeenCalledTimes(0);
    });
    it('should return role when attempting to rename existing one.', async () => {
      const worker2Role = Role.create({
        name: 'workerx',
        permissions: [],
      }).unwrap();

      roleRepoMock.rename.mockImplementation(
        (data: { userRoleId: string; role: Role }) => Ok(worker2Role),
      );
      systemRoleMock.hasId.mockReturnValue(false);
      const role = await service.renameRole('roleId', worker2Role.id, {
        name: worker2Role.name,
      });
      expect(role).toStrictEqual(worker2Role.toJSON());
      expect(systemRoleMock.hasId).toHaveBeenCalledTimes(1);
      expect(roleRepoMock.rename).toHaveBeenCalledWith({
        role: worker2Role,
        userRoleId: 'roleId',
      });
      expect(roleRepoMock.rename).toHaveBeenCalledTimes(1);
    });
  });
  describe('removeRole', () => {
    it('should throw when trying to remove a system role', async () => {
      systemRoleMock.hasId.mockReturnValue(true);

      await expect(
        service.removeRole('user-role-id', 'role-id'),
      ).rejects.toThrow(new Error('System roles cannot be removed'));

      expect(acsyncServiceMock.removeRole).toHaveBeenCalledTimes(0);
      expect(roleRepoMock.deleteById).toHaveBeenCalledTimes(0);
    });
    it('should remove a non-system role successfully', async () => {
      systemRoleMock.hasId.mockReturnValue(false);
      systemRoleMock.getCustomerRoleId.mockReturnValue('customer-id');
      acsyncServiceMock.removeRole.mockResolvedValue(true);
      roleRepoMock.deleteById.mockResolvedValue(Ok(1));

      const result = await service.removeRole('user-role-id', 'role-id');

      expect(result).toBe(1);

      expect(acsyncServiceMock.removeRole).toHaveBeenCalledWith('role-id');
      expect(roleRepoMock.deleteById).toHaveBeenCalledWith({
        requesterRoleId: 'user-role-id',
        targetRoleId: 'role-id',
        defaultRoleId: 'customer-id',
      });
    });
  });
});
