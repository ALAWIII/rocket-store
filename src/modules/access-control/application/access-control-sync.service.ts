// src/modules/access-control/application/access-control-sync.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Enforcer } from 'casbin';

import { IRoleRepository } from '../infrastructure/repositories/role.repository';
import type { Role } from '../domain/role';
import type { Permission } from '../domain/permission';
import { AUTHZ_ENFORCER } from 'nest-authz';

@Injectable()
export class AccessControlSyncService {
  private readonly logger = new Logger(AccessControlSyncService.name);

  constructor(
    @Inject(AUTHZ_ENFORCER)
    private readonly enforcer: Enforcer,
    @Inject(IRoleRepository)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async reloadFromDatabase(): Promise<void> {
    const roles = await this.roleRepository.loadAll();
    const policies = this.toPolicies(roles);

    this.enforcer.clearPolicy();

    if (policies.length > 0) {
      await this.enforcer.addPolicies(policies);
    }

    this.logger.log(
      `Casbin policies reloaded: ${policies.length} policies from ${roles.length} roles`,
    );
  }

  private toPolicies(roles: Role[]): string[][] {
    const seen = new Set<string>();
    const policies: string[][] = [];

    for (const role of roles) {
      const roleJson = role.toJSON();
      for (const permission of roleJson.permissions) {
        const policy = this.toPolicy(roleJson.name.value, permission);
        const key = policy.join('::');

        if (seen.has(key)) continue;
        seen.add(key);
        policies.push(policy);
      }
    }

    return policies;
  }

  private toPolicy(roleName: string, permission: Permission): string[] {
    const perm = permission.toJSON();
    return [roleName, perm.entity, perm.action, perm.scope];
  }
}
