import { Permission } from './permission';

const ROLE_TYPE = {
  Admin: 'Admin',
  Customer: 'Customer',
  Custom: 'Custom',
} as const;
type RoleType = keyof typeof ROLE_TYPE;
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
