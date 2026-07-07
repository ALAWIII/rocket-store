import path from 'node:path';
import { newEnforcer, Enforcer } from 'casbin';

export async function createCasbinEnforcer(): Promise<Enforcer> {
  const modelPath = path.join(__dirname, 'model.conf');
  const enforcer = await newEnforcer(modelPath);

  enforcer.clearPolicy();

  return enforcer;
}
