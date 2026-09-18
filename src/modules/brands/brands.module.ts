import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandEntity } from './infrastructure/entities/brand.entity';
import { BrandImagesEntity } from './infrastructure/entities/brand-images.entity';
import { BrandsService } from './brands.service';
import { IBrandRepository } from './infrastructure/repositories/brand.repository';
import { BrandRepository } from './infrastructure/repositories/brand.typeorm.repository';
import { BrandsController } from './brands.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BrandEntity, BrandImagesEntity])],
  providers: [
    { provide: IBrandRepository, useClass: BrandRepository },
    BrandsService,
  ],
  controllers: [BrandsController],
})
export class BrandsModule {}
