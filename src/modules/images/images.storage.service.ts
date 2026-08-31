import { PassThrough, Readable } from 'stream';
import { IJobsService } from 'src/jobs/jobs.service';
import { ObjectStorageS3Client } from 'src/object-storage/object-storage.s3-client';
import { Upload } from '@aws-sdk/lib-storage';
import { AsyncResult, Result } from '@allawiii/results-ts';
import { ImageStorageError } from './images.storage.error';
import { ImageDeletionPayload } from './images-worker.service';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
type ImgResult<T> = AsyncResult<T, ImageStorageError>;
export interface UploadImageParams {
  stream: Readable;
  imageKey: string;
  contentType: string;
  maxSizeBytes?: number;
}

export interface UploadImageResult {
  key: string;
  url: string;
  checksum: string;
  size: number;
  contentType: string;
}

export class ImagesStorageService {
  private readonly jobKind = 'image.delete';
  constructor(
    private readonly s3Client: ObjectStorageS3Client,
    private readonly jobService: IJobsService,
  ) {}
  upload(params: UploadImageParams): ImgResult<UploadImageResult> {
    const {
      stream,
      imageKey,
      contentType,
      maxSizeBytes = 10 * 1024 * 1024,
    } = params;
    return Result.wrapAsync(async () => {
      const countingStream = new PassThrough();

      const up = new Upload({
        client: this.s3Client.getClient(),
        queueSize: 2,
        params: {
          Bucket: 'images',
          Key: imageKey,
          Body: countingStream,
          ContentType: contentType,
          ChecksumAlgorithm: 'SHA256',
        },
      });

      let uploadedBytes = 0;

      countingStream.on('data', (chunk: Buffer) => {
        uploadedBytes += chunk.length;
        if (uploadedBytes > maxSizeBytes) {
          countingStream.destroy(new Error('File exceeds maximum size'));
          up.abort().catch(() => {});
        }
      });

      stream.pipe(countingStream);

      const result = await up.done();

      return {
        key: imageKey,
        url: result.Location!,
        checksum: result.ChecksumSHA256!,
        size: uploadedBytes,
        contentType,
      };
    }).mapErr(
      (e: unknown) =>
        new ImageStorageError(
          'Uploading image to storage was failed or aborted',
          e,
        ),
    );
  }
  delete(imageKeys: string[]): ImgResult<string[] | null> {
    return Result.wrapAsync(async () =>
      this.jobService.sendJobs(
        this.jobKind,
        imageKeys.map((k): ImageDeletionPayload => {
          return { Key: k };
        }),
      ),
    ).mapErr(
      (e: unknown) =>
        new ImageStorageError('Failed to send delete image jobs', e),
    );
  }
  getPresignedUrl(key: string, expiresInSec = 60 * 5): ImgResult<string> {
    const cmd = new GetObjectCommand({
      Bucket: 'images',
      Key: key,
    });
    return Result.wrapAsync(async () =>
      getSignedUrl(this.s3Client.getClient(), cmd, {
        expiresIn: expiresInSec,
      }),
    ).mapErr(
      (e) =>
        new ImageStorageError(
          `Failed to generate signed url for image key: ${key}`,
          e,
        ),
    );
  }
}
