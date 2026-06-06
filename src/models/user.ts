type Permission = string;
enum RoleType {
  Admin = 'admin',
  Customer = 'customer',
  Custom = 'custom',
}
class Role {
  id: string;
  name: string; // unique
  roleType: RoleType;
  permissions: Set<Permission>;
}

class User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
