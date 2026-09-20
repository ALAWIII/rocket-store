import {
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  S3Client,
  CreateBucketCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';
import { Readable } from 'stream';
import { TEST_ENV } from '../constants/env-test-values.constant';
import { v7 } from 'uuid';

export class ObjectStorageClientTest {
  private constructor(
    private readonly _client: S3Client,
    private readonly _bucket: string,
  ) {}
  static async create() {
    const agent = new https.Agent({
      keepAlive: true,
      maxSockets: TEST_ENV.RUSTFS_MAX_SOCKETS,
      keepAliveMsecs: 1000,
    });

    const client = new S3Client({
      region: TEST_ENV.RUSTFS_REGION,
      endpoint: TEST_ENV.RUSTFS_ENDPOINT,
      credentials: {
        accessKeyId: TEST_ENV.RUSTFS_ACCESS_KEY,
        secretAccessKey: TEST_ENV.RUSTFS_SECRET_KEY,
      },
      forcePathStyle: true,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 5_000,
        requestTimeout: 30_000,
        httpsAgent: agent,
      }),
    });
    const bucket = await this.createBucket(client);
    return new ObjectStorageClientTest(client, bucket);
  }
  private static async createBucket(client: S3Client): Promise<string> {
    const bucketName = v7();

    const cmd = new CreateBucketCommand({
      Bucket: bucketName,
    });
    await client.send(cmd);
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AnonymousRead',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`,
        },
      ],
    };

    // 3. Apply the policy
    await client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(bucketPolicy),
      }),
    );
    return bucketName;
  }
  async cleanup() {
    let continuationToken: string | undefined;

    // 1. List and delete all objects (handles pagination for >1000 files)
    do {
      const listRes = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this._bucket,
          ContinuationToken: continuationToken,
        }),
      );

      if (listRes.Contents && listRes.Contents.length > 0) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this._bucket,
            Delete: {
              Objects: listRes.Contents.map((obj) => ({ Key: obj.Key! })),
            },
          }),
        );
      }

      continuationToken = listRes.NextContinuationToken;
    } while (continuationToken);

    // 2. Delete the now-empty bucket
    await this.client.send(new DeleteBucketCommand({ Bucket: this._bucket }));
  }
  get client(): S3Client {
    return this._client;
  }
  get bucket(): string {
    return this._bucket;
  }
  /**
   * Downloads the object and converts the stream to a Buffer.
   */
  async download(key: string): Promise<Buffer> {
    const cmd = new GetObjectCommand({ Bucket: 'images', Key: key });
    const response = await this.client.send(cmd);

    if (!response.Body) throw new Error(`Object ${key} has no body`);
    const chunks = (await (response.Body as Readable).toArray()) as Buffer[];

    return Buffer.concat(chunks);
  }

  /**
   * Fetches metadata without downloading the whole file (efficient).
   */
  async fetchInfo(key: string) {
    const cmd = new HeadObjectCommand({ Bucket: 'images', Key: key });
    const response = await this.client.send(cmd);

    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      metadata: response.Metadata,
      lastModified: response.LastModified,
    };
  }

  /**
   * Deletes the object. Returns true if successful.
   */
  async deleteObject(key: string): Promise<boolean> {
    const cmd = new DeleteObjectCommand({ Bucket: 'images', Key: key });
    await this.client.send(cmd);
    return true;
  }
}
