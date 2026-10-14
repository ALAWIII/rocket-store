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
  findAll(): Promise<CategoryResponseDto[]> {
    return this.catRepo
      .findAll()
      .map((cs) => cs.map((c) => c.toJSON()))
      .unwrap();
  }
  findById(id: string): Promise<CategoryResponseDto> {
    return this.catRepo
      .findById(id)
      .map((c) => c.toJSON())
      .unwrap();
  }
  findSubtree(id: string): Promise<CategoryResponseDto[]> {
    return this.catRepo
      .findSubtree(id)
      .map((cs) => cs.map((c) => c.toJSON()))
      .unwrap();
  }
}
