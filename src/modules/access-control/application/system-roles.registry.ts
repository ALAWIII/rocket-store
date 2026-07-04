import { Injectable } from '@nestjs/common';
import type { Role } from '../domain/role';

export type SystemRoleName = 'admin' | 'worker' | 'customer';

@Injectable()
export class SystemRolesRegistry {
  private readonly roles = new Map<SystemRoleName, Role>();

  set(role: Role): void {
    const roleJ = role.toJSON();
    if (!this.isSystemRoleName(roleJ.name.value)) return;
    this.roles.set(roleJ.name.value, role);
  }

  setMany(roles: Role[]): void {
    for (const role of roles) {
      this.set(role);
    }
  }

  get(name: SystemRoleName): Role | undefined {
    return this.roles.get(name);
  }

  getOrThrow(name: SystemRoleName): Role {
    const role = this.roles.get(name);
    if (!role) {
      throw new Error(`System role "${name}" is not loaded`);
    }
    return role;
  }

  has(name: SystemRoleName): boolean {
    return this.roles.has(name);
  }

  clear(): void {
    this.roles.clear();
  }

  private isSystemRoleName(name: string): name is SystemRoleName {
    return name === 'admin' || name === 'worker' || name === 'customer';
  }
}
