import { Test, TestingModule } from '@nestjs/testing';
import { AccessControlBootstrapService } from './access-control.bootstrap.service';
import { AccessControlSyncService } from './access-control-sync.service';
import { SystemRolesRegistry } from './system-roles.registry';
import { IRoleRepository } from '../infrastructure/repositories/role.repository';

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
    upsertByName: jest.fn(),
    loadByNames: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    roleRepositoryMock.loadByNames.mockResolvedValue([
      { id: '1', name: 'admin', permissions: [] },
      { id: '2', name: 'worker', permissions: [] },
      { id: '3', name: 'customer', permissions: [] },
    ]);

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
      ],
    }).compile();

    service = module.get(AccessControlBootstrapService);
  });

  it('should bootstrap access control', async () => {
    await service.onApplicationBootstrap();

    expect(roleRepositoryMock.upsertByName).toHaveBeenCalledTimes(3);
    expect(roleRepositoryMock.upsertByName).toHaveBeenNthCalledWith(
      1,
      'admin',
      [],
    );
    expect(roleRepositoryMock.upsertByName).toHaveBeenNthCalledWith(
      2,
      'worker',
      [],
    );
    expect(roleRepositoryMock.upsertByName).toHaveBeenNthCalledWith(
      3,
      'customer',
      [],
    );

    expect(roleRepositoryMock.loadByNames).toHaveBeenCalledWith([
      'admin',
      'worker',
      'customer',
    ]);

    expect(systemRolesRegistryMock.clear).toHaveBeenCalledTimes(1);
    expect(systemRolesRegistryMock.setMany).toHaveBeenCalledWith([
      { id: '1', name: 'admin', permissions: [] },
      { id: '2', name: 'worker', permissions: [] },
      { id: '3', name: 'customer', permissions: [] },
    ]);

    expect(
      accessControlSyncServiceMock.reloadFromDatabase,
    ).toHaveBeenCalledTimes(1);
  });
});
