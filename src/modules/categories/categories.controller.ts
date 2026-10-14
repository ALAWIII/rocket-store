import { Body, Controller, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from '../access-control/domain/permission';
import { CategoryResponseDto } from './dto/category-response.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly catService: CategoriesService) {}

  @Post()
  @RequirePermission(AllPermissions.category.CategoryCreateAny)
  create(@Body() data: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.catService.createCategory(data);
  }
}
