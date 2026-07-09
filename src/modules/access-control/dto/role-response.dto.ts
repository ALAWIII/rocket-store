import { PermissionDto } from './permission.dto';

export type RoleResponseDto = {
  id: string;
  name: string;
  permissions: PermissionDto[];
};
