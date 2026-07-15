import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTHZ_MODULE_OPTIONS, type AuthZModuleOptions } from 'nest-authz';
import {
  PERMISSION_KEY,
  PermissionAttr,
} from 'src/modules/shared/authorization/decorators/require-permission.decorator';
import { AppUser } from 'src/auth/auth.config';
import { IEnforcerHolder } from '../infrastructure/casbin/enforcer-holder';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(IEnforcerHolder) private readonly enforcerHolder: IEnforcerHolder,
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
    return await this.enforcerHolder.enforce({
      roleId: user.roleId,
      entity: permission.entity,
      action: permission.action,
      scope: permission.scope,
    });
  }
}
