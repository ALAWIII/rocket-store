import { Permission } from 'src/modules/access-control/domain/permission';

export type PermissionTestDto = {
  entity: string;
  visibility: string;
  action: string;
};
export type RoleTestDto = {
  id: string;
  name: string;
  permissions: PermissionTestDto[] | Permission[];
  assignScope?: PermissionTestDto[] | Permission[];
  createScope?: PermissionTestDto[] | Permission[];
};
