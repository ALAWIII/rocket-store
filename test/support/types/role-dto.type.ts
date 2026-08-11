export type PermissionDto = {
  entity: string;
  visibility: string;
  action: string;
};
export type RoleDto = {
  id: string;
  name: string;
  permission: PermissionDto[];
  assignScope?: PermissionDto[];
  createScope?: PermissionDto[];
};
