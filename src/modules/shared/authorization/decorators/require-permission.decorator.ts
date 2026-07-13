import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export interface PermissionAttr {
  entity: string;
  action: string;
  scope: string;
}

export const RequirePermission = (permission: PermissionAttr) =>
  SetMetadata(PERMISSION_KEY, permission);
