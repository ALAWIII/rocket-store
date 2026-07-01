import { Permission } from './permission';

export class Role {
  constructor(
    private readonly id: string,
    private name: string, // unique
    private permissions: Permission[],
  ) {}
  findPermission(perm: Permission): number {
    return this.permissions.findIndex((p) => p.equals(perm));
  }
  addPermission(perm: Permission) {
    const index = this.findPermission(perm);
    if (index >= 0) return;

    this.permissions.push(perm);
  }
  removePermission(perm: Permission) {
    const index = this.findPermission(perm);
    if (index < 0) return;
    this.permissions.splice(index, 1);
  }
  setName(name: string) {
    this.name = name;
  }
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      permissions: this.permissions.map((p) => p.toJSON()),
    };
  }
}
