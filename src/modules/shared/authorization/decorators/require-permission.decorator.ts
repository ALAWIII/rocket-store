import { SetMetadata } from '@nestjs/common';
import { Permission } from 'src/modules/access-control/domain/permission';

export const PERMISSION_KEY = 'permission';

export interface PermissionAttr {
  entity: string;
  action: string;
  scope: string;
}

export const RequirePermission = (permission: Permission) =>
  SetMetadata<string, PermissionAttr>(PERMISSION_KEY, permission.toJSON());
