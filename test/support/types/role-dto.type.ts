export type PermissionTestDto = {
  entity: string;
  visibility: string;
  action: string;
};
export type RoleTestDto = {
  id: string;
  name: string;
  permission: PermissionTestDto[];
  assignScope?: PermissionTestDto[];
  createScope?: PermissionTestDto[];
};
