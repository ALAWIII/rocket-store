import { Module } from '@nestjs/common';
import { ImageEntity } from './infrastructure/entities/image.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesService } from './images.service';
import { IImageRepository } from './infrastructure/repositories/image.repository';
import { ImageRepository } from './infrastructure/repositories/image.typeorm.repository';
import { ImagesStorageService } from './images.storage.service';
import { ImagesWorkerService } from './images-worker.service';
import { ImagesController } from './images.controller';
import { IJobsService } from 'src/jobs/jobs.service';
import { JobsModule } from 'src/jobs/jobs.module';
import { ObjectStorageModule } from 'src/object-storage/object-storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImageEntity]),
    JobsModule,
    ObjectStorageModule,
  ],
  providers: [
    ImagesWorkerService,
    ImagesService,
    ImagesStorageService,
    { provide: IImageRepository, useClass: ImageRepository },
  ],
  controllers: [ImagesController],
})
export class ImagesModule {}
