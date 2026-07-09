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
    upsertByName: jest.fn(),
    removeById: jest.fn(),
  };
  const systemRole = {
    isSystemRoleName: jest.fn(),
    hasId: jest.fn(),
    getCustomerRoleId: jest.fn(),
  };
  const acsyncService = { upsertRole: jest.fn(), removeRole: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlService,
        { provide: IUserRepository, useValue: userRepoMock },
        { provide: IRoleRepository, useValue: roleRepoMock },
        { provide: SystemRolesRegistry, useValue: systemRole },
        { provide: AccessControlSyncService, useValue: acsyncService },
      ],
    }).compile();
    service = module.get(AccessControlService);
    expect(service).toBeDefined();
  });
  describe('createRole', () => {
    it('should return null when attempting to create/update an existing system Role.', async () => {
      const adminRole = { name: 'admin', permissions: [] };
      systemRole.isSystemRoleName.mockReturnValue(true);
      const result = await service.createRole(adminRole);
      expect(result).toBeNull();
      expect(systemRole.isSystemRoleName).toHaveBeenCalledTimes(1);
      expect(roleRepoMock.upsertByName).toHaveBeenCalledTimes(0);
    });
    it('should successfully upsert new role.', async () => {
      const devRoleDto = { name: 'developer', permissions: [] };
      const devRole = Role.create(devRoleDto);
      systemRole.isSystemRoleName.mockReturnValue(false);
      roleRepoMock.upsertByName.mockReturnValue(devRole);
      const roleId = await service.createRole(devRoleDto);
      expect(roleId).not.toBeNull();
      expect(roleId).toStrictEqual(devRole.id);
      expect(roleRepoMock.upsertByName).toHaveBeenCalledWith(
        devRoleDto.name,
        devRoleDto.permissions,
      );
      expect(roleRepoMock.upsertByName).toHaveBeenCalledTimes(1);
      expect(acsyncService.upsertRole).toHaveBeenCalledWith(devRole);
      expect(acsyncService.upsertRole).toHaveBeenCalledTimes(1);
      expect(systemRole.isSystemRoleName).toHaveBeenCalledTimes(1);
    });
  });
});
