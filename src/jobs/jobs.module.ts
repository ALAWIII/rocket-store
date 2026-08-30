import { Module } from '@nestjs/common';
import { IJobsService } from './jobs.service';
import { JobsPgBossService } from './jobs.pg-boss.service';
import { PgBossCoreService } from './pg-boss.core.service';

@Module({
  providers: [
    PgBossCoreService,
    { provide: IJobsService, useClass: JobsPgBossService },
  ],
  exports: [IJobsService],
})
export class JobsModule {}
