import { Inject, Injectable, Logger } from '@nestjs/common';

import { IRoleRepository } from '../infrastructure/repositories/role.repository';
import type { Role } from '../domain/role';
import { Permission } from '../domain/permission';
import { createCasbinEnforcer } from '../enforcer-holder/infrastructure/casbin/casbin.factory';
import { IEnforcerHolder } from '../enforcer-holder/infrastructure/casbin/enforcer-holder';

@Injectable()
export class AccessControlSyncService {
  private readonly logger = new Logger(AccessControlSyncService.name);

  constructor(
    @Inject(IEnforcerHolder)
    private readonly enforcer: IEnforcerHolder,
    @Inject(IRoleRepository)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async reloadFromDatabase(): Promise<void> {
    const roles = await this.roleRepository.loadAll();
    if (roles.isErr()) {
      throw roles.error;
    }

    const allRoles = roles.unwrap();
    const policies = this.toPolicies(allRoles);
    const newEnforcer = await createCasbinEnforcer();

    if (policies.length > 0) {
      await newEnforcer.addPolicies(policies);
    }

    this.enforcer.set(newEnforcer);

    this.logger.log(
      `Casbin policies reloaded: ${policies.length} policies from ${allRoles.length} roles`,
    );
  }
  async getPermissions(roleId: string): Promise<Map<string, Permission>> {
    const policies = (await this.enforcer.getPoliciesById(roleId)).map((p) =>
      Permission.fromPrimitives({
        entity: p[1],
        action: p[2],
        scope: p[3],
      }).unwrap(),
    );
    const permissionMap = new Map(policies.map((p) => [p.key(), p]));
    return permissionMap;
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
    const currentPolicies = await this.enforcer.getPoliciesById(roleId);

    if (currentPolicies.length === 0) return true;

    return await this.enforcer.removePolicies(currentPolicies);
  }
  async addRole(role: Role) {
    const policies = this.toPolicies([role]);
    if (policies.length === 0) return true;
    return this.enforcer.addPolicies(policies);
  }
  async hasRole(roleId: string): Promise<boolean> {
    const policies = await this.enforcer.getPoliciesById(roleId);
    return policies.length > 0;
  }
  private toPolicies(roles: Role[]): string[][] {
    const seen = new Set<string>();
    const policies: string[][] = [];

    for (const role of roles) {
      const rolePolicies = role.toFlatPolicies();
      for (const policy of rolePolicies) {
        const key = policy.join('::');
        if (seen.has(key)) continue;
        seen.add(key);
        policies.push(policy);
      }
    }
    seen.clear();
    return policies;
  }
}
