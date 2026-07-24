import { SetMetadata } from '@nestjs/common';
import { Permission } from 'src/modules/access-control/domain/permission';

export const PERMISSION_KEY = 'permission';

export interface PermissionAttr {
  entity: string;
  action: string;
  visibility: string;
}

export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(
    PERMISSION_KEY,
    permissions.map((permission) => permission.toJSON()),
  );
