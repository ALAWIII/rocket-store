import { Module } from '@nestjs/common';
import { ObjectStorageS3Client } from './object-storage.s3-client';

@Module({
  providers: [ObjectStorageS3Client],
  exports: [ObjectStorageS3Client],
})
export class ObjectStorageModule {}
