import { Injectable } from '@nestjs/common';
import {
  CreateWorkerOptions,
  IJobsService,
  JobData,
  JobId,
  WorkerId,
} from './jobs.service';
import { PgBossCoreService } from './pg-boss.core.service';

@Injectable()
export class JobsPgBossService implements IJobsService {
  constructor(private readonly core: PgBossCoreService) {}

  private get boss() {
    return this.core.getBoss();
  }

  async sendJobs<T extends JobData>(
    jobKind: string,
    jobs: T[],
  ): Promise<JobId[] | null> {
    return this.boss.insert(jobKind, jobs);
  }

  async createWorker<T extends JobData>(
    jobKind: string,
    handler: (data: T[]) => Promise<void>,
    options?: CreateWorkerOptions,
  ): Promise<WorkerId> {
    return this.boss.work<T>(
      jobKind,
      {
        batchSize: options?.batchSize ?? 10,
        pollingIntervalSeconds: 5,
        notifyPollingIntervalSeconds: 10,
        localConcurrency: options?.concurrency ?? 10,
      },
      (jobs) => handler(jobs.map((j) => j.data)),
    );
  }
  async createJobQueue(name: string): Promise<void> {
    await this.boss.createQueue(name, {
      notify: true,
      retryLimit: Infinity,
      retryBackoff: true,
    });
  }
}
