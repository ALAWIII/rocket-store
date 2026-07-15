import { Injectable } from '@nestjs/common';
import { Enforcer } from 'casbin';
import { IEnforcerHolder } from './enforcer-holder';

@Injectable()
export class EnforcerHolder implements IEnforcerHolder {
  private enforcer: Enforcer | null = null;

  set(enforcer: Enforcer) {
    this.enforcer = enforcer;
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
