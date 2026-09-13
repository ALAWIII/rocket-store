import { Readable, Transform, TransformCallback } from 'node:stream';
import { IJobsService } from 'src/jobs/jobs.service';
import { ObjectStorageS3Client } from 'src/object-storage/object-storage.s3-client';
import { Upload } from '@aws-sdk/lib-storage';
import { AsyncResult, Option, Result } from '@allawiii/results-ts';
import {
  ImageStorageError,
  MaxSizeExceededError,
} from './images.storage.error';
import { ImageDeletionPayload } from './images-worker.service';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const BUCKET = 'images';

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

class MeteringHashStream extends Transform {
  private hash = createHash('sha256');
  private bytes = 0;

  constructor(private readonly maxSizeBytes: number) {
    super();
  }

  _transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback) {
    this.bytes += chunk.length;
    if (this.bytes > this.maxSizeBytes) {
      // on error stop and send back the final message which is error
      cb(new MaxSizeExceededError(this.maxSizeBytes));
      return;
    }
    this.hash.update(chunk);
    cb(null, chunk);
  }

  get size(): number {
    return this.bytes;
  }

  get checksum(): string {
    return this.hash.digest('hex');
  }
}
@Injectable()
export class ImagesStorageService {
  private logger = new Logger(MeteringHashStream.name);
  private readonly jobKind = 'image.delete';
  constructor(
    private readonly s3Client: ObjectStorageS3Client,
    private readonly jobService: IJobsService,
  ) {}

  uploadToStorage(params: UploadImageParams): ImgResult<UploadImageResult> {
    const {
      stream,
      imageKey,
      contentType,
      maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
    } = params;

    return Result.wrapAsync(async () => {
      const meter = new MeteringHashStream(maxSizeBytes);

      // Forward source errors onto the meter so a broken/aborted upstream
      // stream (e.g. client disconnect) surfaces as a single error instead
      // of an unhandled 'error' event.
      stream.on('error', (err) => meter.destroy(err));

      const up = new Upload({
        client: this.s3Client.getClient(),
        queueSize: 2,
        params: {
          Bucket: BUCKET,
          Key: imageKey,
          Body: meter,
          ContentType: contentType,
        },
      });

      // Kick off the pipe; meter.destroy(err) (from either size overflow
      // or a forwarded source error) will cause up.done() to reject.
      stream.pipe(meter);

      try {
        const result = await up.done();
        return {
          key: imageKey,
          url: result.Location!,
          checksum: meter.checksum,
          size: meter.size,
          contentType,
        };
      } catch (err) {
        await up.abort().catch((abortErr) => {
          this.logger.error(
            `Failed to abort S3 upload for key=${imageKey}`,
            abortErr,
          );
        });
        throw err;
      }
    }).mapErr((e: unknown) => {
      if (e instanceof MaxSizeExceededError) return e;
      return new ImageStorageError(
        'Uploading image to storage was failed or aborted',
        e,
      );
    });
  }
  /**
   * NOTE: this does not delete the object synchronously — it enqueues an
   * async delete job. A resolved Ok here means "job accepted", not
   * "object removed". Callers relying on immediate deletion (e.g. rollback
   * after a failed DB save) should be aware there's a window where the
   * object still exists in storage.
   */
  sendDeleteImgs(imageKeys: string[]): ImgResult<Option<string[]>> {
    return this.jobService
      .sendJobs(
        this.jobKind,
        imageKeys.map((k): ImageDeletionPayload => {
          return { Key: k };
        }),
      )
      .mapErr(
        (e) =>
          new ImageStorageError(
            `Failed to send delete image jobs: ${e.message}`,
            e,
          ),
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
