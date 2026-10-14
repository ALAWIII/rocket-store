import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { AllPermissions } from '../access-control/domain/permission';
import { CategoryResponseDto } from './dto/category-response.dto';
import { UpdateDetailsDto } from './dto/update-details.dto';
import { MoveCategoryDto } from './dto/move-category.dto';
import { RemoveCategoryDto } from './dto/remove-category.dto';
import { AffectedDeletedResponseDto } from '../shared/dto/affected-deleted-response.dto';
import { AttachImagesToCategoryDto } from './dto/attach-images-to-category.dto';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
import { DetachImagesDto } from '../shared/dto/detach-images.dto';
import { DetachImagesResponseDto } from '../shared/dto/detach-images-response.dto';

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
  @Post(':id')
  @RequirePermission(AllPermissions.category.CategoryUpdateAny)
  move(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string, @Body() parent: MoveCategoryDto) {
    this.catService.moveCategory(id, parent.parentId);
  }
  @Delete(':id')
  @RequirePermission(AllPermissions.category.CategoryDeleteAny)
  remove(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Query() query: RemoveCategoryDto,
  ): Promise<AffectedDeletedResponseDto> {
    return this.catService.delete(id, query.withSubtree);
  }

  @Post(':id/images')
  @RequirePermission(AllPermissions.images.ImagesAttachAny)
  attachImages(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: AttachImagesToCategoryDto,
  ): Promise<ImageResponseDto[]> {
    return this.catService.attachImages(id, dto);
  }

  @Post(':id/images/detach')
  @RequirePermission(AllPermissions.images.ImagesAttachAny)
  detachImages(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: DetachImagesDto,
  ): Promise<DetachImagesResponseDto> {
    return this.catService.detachImages(id, dto);
  }

  @Get(':id/images')
  @RequirePermission(AllPermissions.images.ImagesReadAny)
  findBanners(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<ImageResponseDto[]> {
    return this.catService.findBanners(id);
  }
}
