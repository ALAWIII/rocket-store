import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Enforcer } from 'casbin';
import {
  AUTHZ_ENFORCER,
  AUTHZ_MODULE_OPTIONS,
  type AuthZModuleOptions,
} from 'nest-authz';
import {
  PERMISSION_KEY,
  PermissionAttr,
} from 'src/modules/shared/authorization/decorators/require-permission.decorator';
import { AppUser } from 'src/auth/auth.config';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTHZ_ENFORCER) private readonly enforcer: Enforcer,
    @Inject(AUTHZ_MODULE_OPTIONS)
    private readonly options: AuthZModuleOptions,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<PermissionAttr>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) return true;

    const user = this.options.userFromContext(context) as AppUser;
    return await this.enforcer.enforce(
      user.roleId,
      permission.entity,
      permission.action,
      permission.scope,
    );
  }
}
