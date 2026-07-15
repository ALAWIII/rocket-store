import { Injectable } from '@nestjs/common';
import { Enforcer } from 'casbin';
import { IEnforcerHolder } from './enforcer-holder';

@Injectable()
export class EnforcerHolder implements IEnforcerHolder {
  private enforcer: Enforcer | null = null;

  set(enforcer: Enforcer) {
    this.enforcer = enforcer;
  }
  async enforce(enforceData: {
    roleId: string;
    entity: string;
    action: string;
    scope: string;
  }): Promise<boolean> {
    return this.get().enforce(
      enforceData.roleId,
      enforceData.entity,
      enforceData.action,
      enforceData.scope,
    );
  }
  private get(): Enforcer {
    if (!this.enforcer) throw new Error('Enforcer not initialized');
    return this.enforcer;
  }
  async addPolicies(policies: string[][]): Promise<boolean> {
    return await this.get().addPolicies(policies);
  }
  clearPolicy(): void {
    return this.get().clearPolicy();
  }
  async getPoliciesById(roleId: string): Promise<string[][]> {
    return await this.get().getFilteredPolicy(0, roleId);
  }
  async removePolicies(policies: string[][]): Promise<boolean> {
    return await this.get().removePolicies(policies);
  }
}
