import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { ConfigService } from '@nestjs/config';
import https from 'https';

@Injectable()
export class ObjectStorageS3Client {
  private readonly client: S3Client;

  constructor(config: ConfigService) {
    const agent = new https.Agent({
      keepAlive: true,
      maxSockets: 256,
      keepAliveMsecs: 1000,
    });

    this.client = new S3Client({
      region: config.getOrThrow('RUSTFS_REGION'),
      endpoint: config.getOrThrow('RUSTFS_ENDPOINT'),
      credentials: {
        accessKeyId: config.getOrThrow('RUSTFS_ACCESS_KEY'),
        secretAccessKey: config.getOrThrow('RUSTFS_SECRET_KEY'),
      },
      forcePathStyle: true,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 5_000,
        requestTimeout: 30_000,
        httpsAgent: agent,
      }),
    });
  }

  getClient(): S3Client {
    return this.client;
  }
}
