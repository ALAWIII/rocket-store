import { Enforcer } from 'casbin';
type Policy = {
  roleId: string;
  entity: string;
  action: string;
  visibility: string;
};
export abstract class IEnforcerHolder {
  abstract set(enforcer: Enforcer): void;
  abstract clearPolicy(): void;
  abstract addPolicies(policies: string[][]): Promise<boolean>;
  abstract getPoliciesById(roleId: string): Promise<string[][]>;
  abstract removePolicies(policies: string[][]): Promise<boolean>;
  abstract hasPolicy(policy: Policy): Promise<boolean>;
  abstract enforce(policy: Policy): Promise<boolean>;
}
