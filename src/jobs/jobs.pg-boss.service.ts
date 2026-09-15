import { Injectable } from '@nestjs/common';
import {
  CreateWorkerOptions,
  IJobsService,
  JobData,
  JobId,
  WorkerId,
} from './jobs.service';
import { PgBossCoreService } from './pg-boss.core.service';
import { AsyncResult, Option, Result } from '@allawiii/results-ts';
import { JobsError } from './jobs.error';

@Injectable()
export class JobsPgBossService implements IJobsService {
  constructor(private readonly core: PgBossCoreService) {}

  private get boss() {
    return this.core.getBoss();
  }

  sendJobs<T extends JobData>(
    jobKind: string,
    jobs: T[],
  ): AsyncResult<Option<JobId[]>, JobsError> {
    return Result.wrapAsync(() => this.boss.insert(jobKind, jobs))
      .map(Option.fromNullable)
      .mapErr((e) => new JobsError(`Failed to send jobs`, e));
  }

  createWorker<T extends JobData>(
    jobKind: string,
    handler: (data: T[]) => Promise<void>,
    options?: CreateWorkerOptions,
  ): AsyncResult<WorkerId, JobsError> {
    return Result.wrapAsync(() =>
      this.boss.work<T>(
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
      this.boss.createQueue(name, {
        notify: true,
        // it will error if we provide Infinity
        retryLimit: 9999999,
        retryBackoff: true,
      }),
    ).mapErr((e) => new JobsError(`Failed to create job queue: ${name}`, e));
  }
}
