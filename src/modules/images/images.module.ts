import { Module } from '@nestjs/common';
import { ImageEntity } from './infrastructure/entities/image.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({ imports: [TypeOrmModule.forFeature([ImageEntity])] })
export class ImagesModule {}
