import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';
import { AppConfigService } from 'src/app-config/app-config.service';

@Injectable()
export class ObjectStorageS3Client {
  private readonly _client: S3Client;
  private readonly _bucket: string;

  constructor(config: AppConfigService) {
    this._bucket = config.storage.bucket;
    const agent = new https.Agent({
      keepAlive: true,
      maxSockets: config.storage.maxSockets,
      keepAliveMsecs: 1000,
    });

    this._client = new S3Client({
      region: config.storage.region,
      endpoint: config.storage.endpoint,
      credentials: {
        accessKeyId: config.storage.accessKey,
        secretAccessKey: config.storage.secretKey,
      },
      forcePathStyle: true,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 5_000,
        requestTimeout: 30_000,
        httpsAgent: agent,
      }),
    });
  }
  get bucket(): string {
    return this._bucket;
  }
  get client(): S3Client {
    return this._client;
  }
}
