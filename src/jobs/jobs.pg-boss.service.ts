import { Injectable, Logger } from '@nestjs/common';
import {
  CreateWorkerOptions,
  IJobsService,
  JobData,
  JobId,
  WorkerId,
} from './jobs.service';
import { PgBossCoreService } from './pg-boss.core.service';
import { AsyncResult, Ok, Result } from '@allawiii/results-ts';
import { JobsError } from './jobs.error';

@Injectable()
export class JobsPgBossService implements IJobsService {
  private readonly logger = new Logger(JobsPgBossService.name);
  constructor(private readonly core: PgBossCoreService) {}

  sendJobs<T extends JobData>(
    jobKind: string,
    jobs: T[],
  ): AsyncResult<JobId[], JobsError> {
    this.logger.log(`sending ${jobs.length} of ${jobKind} jobs.`);
    const jobInserts = jobs.map((data) => ({ data }));
    return Result.wrapAsync(() =>
      this.core.boss.insert(jobKind, jobInserts, { returnId: true }),
    )
      .mapErr((e) => new JobsError(`Failed to send jobs`, e))
      .andThen((v) => Ok(v ?? []));
  }

  createWorker<T extends JobData>(
    jobKind: string,
    handler: (data: T[]) => Promise<void>,
    options?: CreateWorkerOptions,
  ): AsyncResult<WorkerId, JobsError> {
    return Result.wrapAsync(() =>
      this.core.boss.work<T>(
        jobKind,
        {
          batchSize: options?.batchSize ?? 10,
          pollingIntervalSeconds: 5,
          notifyPollingIntervalSeconds: 10,
          localConcurrency: options?.concurrency ?? 10,
        },
        (jobs) => handler(jobs.map((j) => j.data)),
      ),
    ).mapErr((e) => new JobsError(`Failed to create Worker`, e));
  }
  createJobQueue(name: string): AsyncResult<void, JobsError> {
    return Result.wrapAsync(() =>
      this.core.boss.createQueue(name, {
        notify: true,
        // it will error if we provide Infinity
        retryLimit: 9999999,
        retryBackoff: true,
      }),
    ).mapErr((e) => new JobsError(`Failed to create job queue: ${name}`, e));
  }
}
