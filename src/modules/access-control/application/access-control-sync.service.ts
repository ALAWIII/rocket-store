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

  async upsertRole(role: Role): Promise<void> {
    const removed = await this.removeRole(role.id);
    const added = await this.addRole(role);
    if (!added) {
      throw new Error(
        `Failed adding Casbin policies for role ${role.id.toString()}`,
      );
    }
  }
  async removeRole(roleId: string): Promise<boolean> {
    const currentPolicies = await this.enforcer.getFilteredPolicy(0, roleId);

    if (currentPolicies.length === 0) return true;

    return await this.enforcer.removePolicies(currentPolicies);
  }
  async addRole(role: Role) {
    const policies = this.toPolicies([role]);
    if (policies.length === 0) return true;
    return this.enforcer.addPolicies(policies);
  }
  async hasRole(roleId: string): Promise<boolean> {
    const policies = await this.enforcer.getFilteredPolicy(0, roleId);
    return policies.length > 0;
  }
  private toPolicies(roles: Role[]): string[][] {
    const seen = new Set<string>();
    const policies: string[][] = [];

    for (const role of roles) {
      const roleJson = role.toJSON();
      for (const permission of roleJson.permissions) {
        const policy = this.toPolicy(roleJson.id.toString(), permission);
        const key = policy.join('::');

        if (seen.has(key)) continue;
        seen.add(key);
        policies.push(policy);
      }
    }
    seen.clear();
    return policies;
  }

  private toPolicy(roleId: string, permission: Permission): string[] {
    const perm = permission.toJSON();
    return [roleId, perm.entity, perm.action, perm.scope];
  }
}
