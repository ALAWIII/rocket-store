import { Injectable } from '@nestjs/common';
import { ICategoryRepository } from './infrastructure/repositories/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './domain/category';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly catRepo: ICategoryRepository) {}
  createCategory(data: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = Category.create(data).unwrap();
    return this.catRepo
      .create(category)
      .map((cat) => cat.toJSON())
      .unwrap();
  }
}
