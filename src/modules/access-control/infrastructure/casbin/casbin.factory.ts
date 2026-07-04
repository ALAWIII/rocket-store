// src/modules/access-control/infrastructure/casbin/casbin.factory.ts
import { join } from 'node:path';
import { newEnforcer, Enforcer } from 'casbin';

export async function createCasbinEnforcer(): Promise<Enforcer> {
  const modelPath = join(__dirname, 'model.conf');

  const enforcer = await newEnforcer(modelPath);

  enforcer.clearPolicy();

  return enforcer;
}
