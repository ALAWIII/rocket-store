import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { DatabaseModule } from 'src/database/database.module';
import { DataSource } from 'typeorm';
import { createAuth } from './auth.config';
import { ConfigService } from '@nestjs/config';
import { AppLogLevel, toAppLogLevel } from 'src/app-logger/app-log.level';
import { Logger } from 'nestjs-pino';
import { AccessControlModule } from 'src/modules/access-control/access-control.module';
import { EmailModule } from 'src/email/email.module';
import { ResendEmailService } from 'src/email/resend-email.service';
import { SystemRolesSeedService } from 'src/modules/access-control/application/system-roles/system-roles.seed.service';
import { SystemRolesRegistry } from 'src/modules/access-control/application/system-roles/system-roles.registry';

@Module({
  imports: [
    AuthModule.forRootAsync({
      imports: [DatabaseModule, AccessControlModule, EmailModule],
      inject: [
        DataSource,
        Logger,
        ConfigService,
        SystemRolesRegistry,
        SystemRolesSeedService,
        ResendEmailService,
      ],
      useFactory: async (
        dataSource: DataSource,
        logger: Logger,
        config: ConfigService,
        systemRoles: SystemRolesRegistry,
        systemRolesSeed: SystemRolesSeedService,
        emailService: ResendEmailService,
      ) => {
        await systemRolesSeed.ensureSeeded();
        const logLevel: AppLogLevel = toAppLogLevel(config.get('LOG_LEVEL'));
        return {
          auth: createAuth(
            dataSource,
            logger,
            logLevel,
            systemRoles.getCustomerRoleId(),
            emailService,
          ),
        };
      },
    }),
  ],
})
export class AppAuthModule {}
