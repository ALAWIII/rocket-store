type Permission = string;
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

class User {
  constructor(
    private readonly id: string,
    private email: string,
    private passwordHash: string,
    private firstName: string,
    private lastName: string,
    private roleId: string,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date,
    private phone?: string,
  ) {}
  setEmail(email: string) {
    this.email = email;
  }
  setPassword(password: string) {
    this.passwordHash = password;
  }
  setPhone(phone: string) {
    this.phone = phone;
  }
  setUpdatedAt(d: Date) {
    this.updatedAt = d;
  }
  setRoleId(r: string) {
    this.roleId = r;
  }
}
