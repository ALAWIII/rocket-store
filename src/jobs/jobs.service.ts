import { AsyncResult, Option } from '@allawiii/results-ts';
import { JobsError } from './jobs.error';

export type JobData = Record<string, unknown>;
export type WorkerId = string;
export type JobId = string;
export type CreateWorkerOptions = { concurrency?: number; batchSize?: number };
export abstract class IJobsService {
  /**
   * Used to send new jobs with their data to a specified `jobKind` (or queue name).
   * @param jobKind
   * @param data
   */
  abstract sendJobs<T extends JobData>(
    jobKind: string,
    jobs: T[],
  ): AsyncResult<Option<JobId[]>, JobsError>;
  /**
   * Create new worker on a specified existed `jobKind` (queue name).
   * @param jobKind
   * @param handler
   */
  abstract createWorker<T extends JobData>(
    jobKind: string,
    handler: (data: T[]) => Promise<void>,
    options?: CreateWorkerOptions,
  ): AsyncResult<WorkerId, JobsError>;

  /**
   * Responsible for creating new queue (new kind of jobs) with a unique given name.
   * @param name
   */
  abstract createJobQueue(name: string): AsyncResult<void, JobsError>;
}
