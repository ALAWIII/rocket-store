import { ForbiddenException, Global, Module } from '@nestjs/common';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { RoleRepository } from './infrastructure/repositories/typeorm-role.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './infrastructure/entities/role.entity';
import { AccessControlBootstrapService } from './application/bootstrap/access-control.bootstrap.service';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { RoleService } from './role.service';
import { SystemRolesRegistry } from './application/system-roles/system-roles.registry';
import { AUTHZ_ENFORCER, AuthZModule } from 'nest-authz';
import { AppUser, AuthenticatedRequest } from 'src/auth/auth.config';
import { UsersModule } from '../users/users.module';
import { RolesController } from './role.controller';
import { AccessGuard } from './guards/access-control.guard';
import { IEnforcerHolder } from './enforcer-holder/infrastructure/casbin/enforcer-holder';
import { EnforcerHolderModule } from './enforcer-holder/enforcer-holder.module';
import { SystemRolesSeedService } from './application/system-roles/system-roles.seed.service';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    EnforcerHolderModule,
    UsersModule,
    TypeOrmModule.forFeature([RoleEntity]),
    AuthZModule.register({
      imports: [EnforcerHolderModule],
      enforcerProvider: {
        provide: AUTHZ_ENFORCER,
        useExisting: IEnforcerHolder,
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
    SystemRolesSeedService,
    AccessGuard,
    AccessControlBootstrapService,
    AccessControlSyncService,
    RoleService,
    SystemRolesRegistry,
    { provide: IRoleRepository, useClass: RoleRepository },
    { provide: APP_GUARD, useClass: AccessGuard },
  ],
  exports: [SystemRolesRegistry, SystemRolesSeedService],
  controllers: [RolesController],
})
export class AccessControlModule {}
