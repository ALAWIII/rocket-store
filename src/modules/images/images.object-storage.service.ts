import { PassThrough, Readable } from 'stream';
import { ObjectStorageS3Client } from 'src/object-storage/object-storage.s3-client';
import { Upload } from '@aws-sdk/lib-storage';
import { Result } from '@allawiii/results-ts';
import { ImageObjectStorageError } from './images.object-storage.error';

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

export class ImagesObjectStorageService {
  constructor(private readonly s3Client: ObjectStorageS3Client) {}
  async upload(
    params: UploadImageParams,
  ): Promise<Result<UploadImageResult, ImageObjectStorageError>> {
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
        new ImageObjectStorageError('Image upload to RustFS failed', e),
    );
  }
}
