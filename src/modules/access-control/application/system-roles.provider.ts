import { Injectable } from '@nestjs/common';
import { Role } from '../domain/role';
import { AllPermissions } from '../domain/permission';

// 1. Shallow copy the array using the spread operator [...]
// This creates a safe reference that cannot mutate your global data source.
const AllPermissionsFlat = Object.values(AllPermissions).flatMap((v1) =>
  Object.values(v1),
);

@Injectable()
export class SystemRolesProvider {
  // 2. Cache the unwrapped roles ONCE when NestJS instantiates this provider
  private readonly roles: Role[] = [
    Role.create({
      name: 'admin',
      permissions: [...AllPermissionsFlat],
      assignScope: [...AllPermissionsFlat],
      createScope: [...AllPermissionsFlat],
    }),
    Role.create({
      name: 'worker',
      permissions: [AllPermissions.address.AddressReadLessOrEqual],
    }),
    Role.create({ name: 'customer', permissions: [] }),
  ].map((r) => r.unwrap());

  getAll(): Role[] {
    return this.roles;
  }

  getNames(): string[] {
    return this.roles.map((r) => r.name);
  }
}
