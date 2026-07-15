import { ForbiddenException, Module } from '@nestjs/common';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { RoleRepository } from './infrastructure/repositories/typeorm-role.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './infrastructure/entities/role.entity';
import { AccessControlBootstrapService } from './application/access-control.bootstrap.service';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { AccessControlService } from './access-control.service';
import { SystemRolesRegistry } from './application/system-roles.registry';
import { AuthZModule } from 'nest-authz';
import { createCasbinEnforcer } from './infrastructure/casbin/casbin.factory';
import { AppUser, AuthenticatedRequest } from 'src/auth/auth.config';
import { UsersModule } from '../users/users.module';
import { RolesController } from './role.controller';
import { SystemRolesProvider } from './application/system-roles.provider';
import { AccessGuard } from './guards/access-control.guard';
import { IEnforcerHolder } from './infrastructure/casbin/enforcer-holder';
import { EnforcerHolder } from './infrastructure/casbin/enforcer-holder.service';
@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RoleEntity]),
    AuthZModule.register({
      enforcerProvider: {
        provide: IEnforcerHolder,
        useFactory: async (): Promise<IEnforcerHolder> => {
          const holder = new EnforcerHolder();
          holder.set(await createCasbinEnforcer());
          return holder;
        },
      },
      userFromContext: (ctx): AppUser => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        if (!request.user || !request.user.roleId) {
          throw new ForbiddenException();
        }
        return request.user;
      },
    }),
  ],
  providers: [
    AccessGuard,
    AccessControlBootstrapService,
    AccessControlSyncService,
    AccessControlService,
    SystemRolesRegistry,
    SystemRolesProvider,
    { provide: IRoleRepository, useClass: RoleRepository },
  ],
  exports: [
    AccessGuard,
    AccessControlService,
    AccessControlSyncService,
    SystemRolesRegistry,
  ],
  controllers: [RolesController],
})
export class AccessControlModule {}
