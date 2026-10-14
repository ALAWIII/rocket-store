import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from '../access-control/domain/permission';
import { CategoryResponseDto } from './dto/category-response.dto';
import { UpdateDetailsDto } from './dto/update-details.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly catService: CategoriesService) {}

  @Post()
  @RequirePermission(AllPermissions.category.CategoryCreateAny)
  create(@Body() data: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.catService.createCategory(data);
  }
  @Get(':id')
  findById(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<CategoryResponseDto> {
    return this.catService.findById(id);
  }
  @Get()
  @RequirePermission(AllPermissions.category.CategoryReadAny)
  findAll(): Promise<CategoryResponseDto[]> {
    return this.catService.findAll();
  }

  @Get(':id/subtree')
  @RequirePermission(AllPermissions.category.CategoryReadAny)
  findSubtree(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<CategoryResponseDto[]> {
    return this.catService.findSubtree(id);
  }
  @Patch(':id')
  @RequirePermission(AllPermissions.category.CategoryUpdateAny)
  update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() data: UpdateDetailsDto,
  ): Promise<CategoryResponseDto> {
    return this.catService.updateDetails(id, data);
  }
}
