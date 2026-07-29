import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AccessControlSyncService } from '../access-control-sync.service';
import { SystemRolesSeedService } from '../system-roles/system-roles.seed.service';

@Injectable()
export class AccessControlBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AccessControlBootstrapService.name);

  constructor(
    private readonly accessControlSyncService: AccessControlSyncService,
    private readonly systemRolesSeedService: SystemRolesSeedService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.accessControlSyncService.reloadFromDatabase();
    await this.systemRolesSeedService.ensureSeeded();
    this.logger.log('Access control bootstrap completed');
  }
}
