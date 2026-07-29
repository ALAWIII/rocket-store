import { AllPermissions } from '../../domain/permission';
import { Role } from '../../domain/role';

const AllPermissionsFlat = Object.values(AllPermissions).flatMap((v1) =>
  Object.values(v1),
);

export const ADMIN_ROLE = Role.create({
  name: 'admin',
  permissions: AllPermissionsFlat,
  assignScope: AllPermissionsFlat,
  createScope: AllPermissionsFlat,
}).unwrap();

export const WORKER_ROLE = Role.create({
  name: 'worker',
  permissions: [AllPermissions.address.AddressReadLessOrEqual],
}).unwrap();
export const CUSTOMER_ROLE = Role.create({
  name: 'customer',
  permissions: [],
}).unwrap();

export const SYSTEM_ROLES = [ADMIN_ROLE, WORKER_ROLE, CUSTOMER_ROLE] as const;
