import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { IJobsService } from 'src/jobs/jobs.service';
import { ObjectStorageS3Client } from 'src/object-storage/object-storage.s3-client';

export type ImageDeletionPayload = { Key: string };

@Injectable()
export class ImagesWorkerService implements OnModuleInit {
  constructor(
    private readonly s3Client: ObjectStorageS3Client,
    private readonly jobService: IJobsService,
  ) {}
  async onModuleInit() {
    await this.jobService.createJobQueue('image.delete');
    for (let x = 1; x <= 5; x++) {
      await this.jobService.createWorker<ImageDeletionPayload>(
        'image.delete',
        (d) => this.deleteImages(d),
      );
    }
  }
  private async deleteImages(imgs: ImageDeletionPayload[]) {
    if (!imgs.length) return;
    const chunks = this.chunk(imgs, 1000);
    await Promise.all(
      chunks.map((chunk) =>
        this.s3Client.getClient().send(
          new DeleteObjectsCommand({
            Bucket: 'images',
            Delete: { Objects: chunk },
          }),
        ),
      ),
    );
  }
  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      out.push(arr.slice(i, i + size));
    }
    return out;
  }
}
