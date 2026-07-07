import { PermissionDto } from './permission.dto';

export type CreateRoleDto = {
  name: string;
  permissions: PermissionDto[];
};
