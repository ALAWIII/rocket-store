import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { DatabaseModule } from 'src/database/database.module';
import { DataSource } from 'typeorm';
import { createAuth } from './auth.config';
import { Logger } from 'nestjs-pino';
import { AccessControlModule } from 'src/modules/access-control/access-control.module';
import { EmailModule } from 'src/email/email.module';
import { SystemRolesSeedService } from 'src/modules/access-control/application/system-roles/system-roles.seed.service';
import { SystemRolesRegistry } from 'src/modules/access-control/application/system-roles/system-roles.registry';
import { IAuthEmailService } from 'src/email/auth-email.service';
import { AppConfigService } from 'src/app-config/app-config.service';

@Module({
  imports: [
    AuthModule.forRootAsync({
      imports: [DatabaseModule, AccessControlModule, EmailModule],
      inject: [DataSource, Logger, AppConfigService, SystemRolesRegistry, SystemRolesSeedService, IAuthEmailService],
      useFactory: async (
        dataSource: DataSource,
        logger: Logger,
        config: AppConfigService,
        systemRoles: SystemRolesRegistry,
        systemRolesSeed: SystemRolesSeedService,
        emailService: IAuthEmailService,
      ) => {
        await systemRolesSeed.ensureSeeded();
        return {
          auth: createAuth(dataSource, logger, config, systemRoles.getCustomerRoleId(), emailService),
        };
      },
    }),
  ],
})
export class AppAuthModule {}
