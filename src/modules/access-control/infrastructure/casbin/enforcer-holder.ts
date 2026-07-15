import { Enforcer } from 'casbin';

export abstract class IEnforcerHolder {
  abstract set(enforcer: Enforcer): void;
  abstract clearPolicy(): void;
  abstract addPolicies(policies: string[][]): Promise<boolean>;
  abstract getPoliciesById(roleId: string): Promise<string[][]>;
  abstract removePolicies(policies: string[][]): Promise<boolean>;
}
