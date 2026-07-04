// access-control.bootstrap.service.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { AccessControlSyncService } from './access-control-sync.service';
import { SystemRolesRegistry } from './system-roles.registry';
import { IRoleRepository } from '../infrastructure/repositories/role.repository';

@Injectable()
export class AccessControlBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AccessControlBootstrapService.name);

  constructor(
    private readonly accessControlSyncService: AccessControlSyncService,
    private readonly systemRolesRegistry: SystemRolesRegistry,
    private readonly roleRepository: IRoleRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.upsertSystemRoles();
    await this.loadSystemRoleIdsIntoRegistry();
    await this.accessControlSyncService.reloadFromDatabase();

    this.logger.log('Access control bootstrap completed');
  }

  private async upsertSystemRoles(): Promise<void> {
    for (const role of this.systemRoles()) {
      await this.roleRepository.upsertByName(role.name, role.permissions);
    }
  }

  private async loadSystemRoleIdsIntoRegistry(): Promise<void> {
    const roles = await this.roleRepository.loadByNames([
      'admin',
      'worker',
      'customer',
    ]);

    this.systemRolesRegistry.clear();
    this.systemRolesRegistry.setMany(roles);
  }
  // here we define all permissions required by the major system roles.
  private systemRoles() {
    return [
      { name: 'admin', permissions: [] },
      { name: 'worker', permissions: [] },
      { name: 'customer', permissions: [] },
    ];
  }
}
