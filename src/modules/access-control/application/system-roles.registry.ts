// src/modules/access-control/application/system-roles.registry.ts
import { Injectable } from '@nestjs/common';

export type SystemRoleName = 'admin' | 'worker' | 'customer';

type RoleId = string;

@Injectable()
export class SystemRolesRegistry {
  private readonly roleIds = new Map<SystemRoleName, RoleId>();

  set(name: SystemRoleName, id: RoleId): void {
    this.roleIds.set(name, id);
  }

  setMany(
    roles: Array<{
      id: RoleId;
      name: string;
    }>,
  ): void {
    for (const role of roles) {
      if (this.isSystemRoleName(role.name)) {
        this.roleIds.set(role.name, role.id);
      }
    }
  }

  get(name: SystemRoleName): RoleId | undefined {
    return this.roleIds.get(name);
  }

  getOrThrow(name: SystemRoleName): RoleId {
    const roleId = this.roleIds.get(name);

    if (!roleId) {
      throw new Error(`System role "${name}" is not loaded`);
    }

    return roleId;
  }

  getAdminRoleId(): RoleId {
    return this.getOrThrow('admin');
  }

  getWorkerRoleId(): RoleId {
    return this.getOrThrow('worker');
  }

  getCustomerRoleId(): RoleId {
    return this.getOrThrow('customer');
  }

  has(name: SystemRoleName): boolean {
    return this.roleIds.has(name);
  }

  clear(): void {
    this.roleIds.clear();
  }

  private isSystemRoleName(name: string): name is SystemRoleName {
    return name === 'admin' || name === 'worker' || name === 'customer';
  }
}
