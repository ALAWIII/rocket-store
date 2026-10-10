import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryEntity } from './infrastructure/entities/category.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryImagesEntity } from './infrastructure/entities/category-images.entity';
import { ICategoryRepository } from './infrastructure/repositories/category.repository';
import { CategoryRepository } from './infrastructure/repositories/category.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity, CategoryImagesEntity])],
  providers: [{ provide: ICategoryRepository, useClass: CategoryRepository }, CategoriesService],
})
export class CategoriesModule {}
