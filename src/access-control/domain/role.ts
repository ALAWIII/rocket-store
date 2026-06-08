import { Permission } from './permission';

enum RoleType {
  Admin = 'admin',
  Customer = 'customer',
  Custom = 'custom',
}
class Role {
  permissions = new Set<Permission>();
  constructor(
    private readonly id: string,
    private name: string, // unique
    private roleType: RoleType,
  ) {}
  addPermission(permission: Permission) {
    this.permissions.add(permission);
  }
  removePermission(permission: Permission) {
    this.permissions.delete(permission);
  }
  setName(name: string) {
    this.name = name;
  }
}
