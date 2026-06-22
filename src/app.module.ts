import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';

@Module({
  imports: [DatabaseModule, AuditLogModule],
})
export class AppModule {}
