import { Module } from '@nestjs/common';
import { IRoleRepository } from './infrastructure/repositories/role.repository';
import { RoleRepository } from './infrastructure/repositories/typeorm-role.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './infrastructure/entities/role.entity';
import { AccessControlBootstrapService } from './application/access-control.bootstrap.service';
import { AccessControlSyncService } from './application/access-control-sync.service';
import { AccessControlService } from './access-control.service';
import { SystemRolesRegistry } from './application/system-roles.registry';
import { AUTHZ_ENFORCER, AuthZModule } from 'nest-authz';
import { createCasbinEnforcer } from './infrastructure/casbin/casbin.factory';
import { AuthenticatedRequest } from 'src/auth/auth.config';
import { UsersModule } from '../users/users.module';
import { AccessControlController } from './access-control.controller';
@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RoleEntity]),
    AuthZModule.register({
      enforcerProvider: {
        provide: AUTHZ_ENFORCER,
        useFactory: async () => createCasbinEnforcer(),
      },
      userFromContext: (ctx) => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        return request.user.roleId ?? null;
      },
    }),
  ],
  providers: [
    AccessControlBootstrapService,
    AccessControlSyncService,
    AccessControlService,
    SystemRolesRegistry,
    { provide: IRoleRepository, useClass: RoleRepository },
  ],
  exports: [
    AccessControlService,
    AccessControlSyncService,
    SystemRolesRegistry,
  ],
  controllers: [AccessControlController],
})
export class AccessControlModule {}
