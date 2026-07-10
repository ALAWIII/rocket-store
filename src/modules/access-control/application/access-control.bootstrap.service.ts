import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { AccessControlSyncService } from './access-control-sync.service';
import { SystemRolesRegistry } from './system-roles.registry';
import { IRoleRepository } from '../infrastructure/repositories/role.repository';
import { SystemRolesProvider } from './system-roles.provider';

@Injectable()
export class AccessControlBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AccessControlBootstrapService.name);

  constructor(
    private readonly accessControlSyncService: AccessControlSyncService,
    private readonly systemRolesRegistry: SystemRolesRegistry,
    private readonly roleRepository: IRoleRepository,
    private readonly systemRoleProvider: SystemRolesProvider,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.upsertSystemRoles();
    await this.loadSystemRoleIdsIntoRegistry();
    await this.accessControlSyncService.reloadFromDatabase();

    this.logger.log('Access control bootstrap completed');
  }

  private async upsertSystemRoles(): Promise<void> {
    for (const role of this.systemRoleProvider.getAll()) {
      await this.roleRepository.upsert(role);
    }
  }

  private async loadSystemRoleIdsIntoRegistry(): Promise<void> {
    const roles = await this.roleRepository.loadByNames(
      this.systemRoleProvider.getNames(),
    );

    this.systemRolesRegistry.clear();
    this.systemRolesRegistry.setMany(roles);
  }
}
