import { Module } from '@nestjs/common';
import { ImageEntity } from './infrastructure/entities/image.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesService } from './images.service';
import { IImageRepository } from './infrastructure/repositories/image.repository';
import { ImageRepository } from './infrastructure/repositories/image.typeorm.repository';
import { ImagesStorageService } from './images.storage.service';
import { ImagesWorkerService } from './images-worker.service';

@Module({
  imports: [TypeOrmModule.forFeature([ImageEntity])],
  providers: [
    ImagesWorkerService,
    ImagesService,
    ImagesStorageService,
    { provide: IImageRepository, useClass: ImageRepository },
  ],
})
export class ImagesModule {}
