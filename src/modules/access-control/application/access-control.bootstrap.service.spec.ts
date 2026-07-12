import { Test, TestingModule } from '@nestjs/testing';
import { AccessControlBootstrapService } from './access-control.bootstrap.service';
import { AccessControlSyncService } from './access-control-sync.service';
import { SystemRolesRegistry } from './system-roles.registry';
import { IRoleRepository } from '../infrastructure/repositories/role.repository';
import { SystemRolesProvider } from './system-roles.provider';
import { Role } from '../domain/role';
import { Ok } from 'ts-results-es';

describe('AccessControlBootstrapService', () => {
  let service: AccessControlBootstrapService;

  const accessControlSyncServiceMock = {
    reloadFromDatabase: jest.fn(),
  };

  const systemRolesRegistryMock = {
    clear: jest.fn(),
    setMany: jest.fn(),
  };

  const roleRepositoryMock = {
    upsert: jest.fn(),
    loadByNames: jest.fn(),
  };
  const systemRoleProviderMock = {
    getNames: jest.fn(),
    getAll: jest.fn(),
  };
  const systemRoles = [
    Role.create({ name: 'admin', permissions: [] }),
    Role.create({ name: 'worker', permissions: [] }),
    Role.create({ name: 'customer', permissions: [] }),
  ];

  beforeEach(async () => {
    jest.clearAllMocks();
    systemRoleProviderMock.getAll.mockReturnValue(systemRoles);
    systemRoleProviderMock.getNames.mockReturnValue([
      'admin',
      'worker',
      'customer',
    ]);
    roleRepositoryMock.loadByNames.mockResolvedValue(Ok(systemRoles));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlBootstrapService,
        {
          provide: AccessControlSyncService,
          useValue: accessControlSyncServiceMock,
        },
        {
          provide: SystemRolesRegistry,
          useValue: systemRolesRegistryMock,
        },
        {
          provide: IRoleRepository,
          useValue: roleRepositoryMock,
        },
        { provide: SystemRolesProvider, useValue: systemRoleProviderMock },
      ],
    }).compile();

    service = module.get(AccessControlBootstrapService);
  });

  it('should bootstrap access control', async () => {
    await service.onApplicationBootstrap();

    expect(roleRepositoryMock.upsert).toHaveBeenCalledTimes(3);
    expect(roleRepositoryMock.upsert).toHaveBeenNthCalledWith(
      1,
      systemRoles[0],
    );
    expect(roleRepositoryMock.upsert).toHaveBeenNthCalledWith(
      2,
      systemRoles[1],
    );
    expect(roleRepositoryMock.upsert).toHaveBeenNthCalledWith(
      3,
      systemRoles[2],
    );

    expect(roleRepositoryMock.loadByNames).toHaveBeenCalledWith([
      'admin',
      'worker',
      'customer',
    ]);

    expect(systemRolesRegistryMock.clear).toHaveBeenCalledTimes(1);
    expect(systemRolesRegistryMock.setMany).toHaveBeenCalledWith(systemRoles);

    expect(
      accessControlSyncServiceMock.reloadFromDatabase,
    ).toHaveBeenCalledTimes(1);
  });
});
