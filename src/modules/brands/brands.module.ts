import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandEntity } from './infrastructure/entities/brand.entity';
import { BrandImagesEntity } from './infrastructure/entities/brand-images.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BrandEntity, BrandImagesEntity])],
})
export class BrandsModule {}
