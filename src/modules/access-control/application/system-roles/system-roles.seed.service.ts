import { Injectable } from '@nestjs/common';
import { SystemRolesRegistry } from './system-roles.registry';
import { IRoleRepository } from '../../infrastructure/repositories/role.repository';
import { Role } from '../../domain/role';
import { SYSTEM_ROLES } from './system-roles.definition';
import { SystemRoleError } from './system-roles.error';

@Injectable()
export class SystemRolesSeedService {
  private seedingPromise?: Promise<void>;
  private seeded = false;
  constructor(
    private readonly registery: SystemRolesRegistry,
    private readonly roleRepository: IRoleRepository,
  ) {}

  ensureSeeded(): Promise<void> {
    if (this.seeded) return Promise.resolve();
    this.seedingPromise ??= this.seed();
    return this.seedingPromise;
  }

  private async seed(): Promise<void> {
    const updatedRoles: Role[] = [];
    for (const role of SYSTEM_ROLES) {
      const upRole = (await this.roleRepository.upsert(role))
        .mapErr(
          (e) =>
            new SystemRoleError(
              `Failed to upsert a system Role: ${role.name}`,
              { cause: e },
            ),
        )
        .unwrap();
      updatedRoles.push(upRole);
    }
    this.registery.setMany(updatedRoles);
    this.seeded = true;
  }
}
