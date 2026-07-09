import { Injectable } from '@nestjs/common';

export const SYSTEM_ROLE_NAMES = ['admin', 'worker', 'customer'] as const;
export type SystemRoleName = (typeof SYSTEM_ROLE_NAMES)[number];
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

  hasId(roleId: RoleId) {
    for (const id of this.roleIds.values()) {
      if (id === roleId) return true;
    }
    return false;
  }
  has(name: SystemRoleName): boolean {
    return this.roleIds.has(name);
  }
  clear() {
    this.roleIds.clear();
  }
  isSystemRoleName(value: string): value is SystemRoleName {
    return SYSTEM_ROLE_NAMES.includes(value as SystemRoleName);
  }
}
