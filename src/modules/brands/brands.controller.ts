import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandsService } from './brands.service';
import { BrandResponseDto } from './dto/brand-response.dto';
import { AllPermissions } from '../access-control/domain/permission';
import { RenameBrandDto } from './dto/rename-brand.dto';
import { RemoveBrandsDto } from './dto/remove-brands.dto';
import { RemoveBrandsResponseDto } from './dto/remove-brands-response.dto';
import { FindAllBrandsFilterDto } from './dto/find-all-brands-filter.dto';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
import { AttachImagesToBrandDto } from './dto/attach-images-to-brand.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandService: BrandsService) {}
  @Post()
  @RequirePermission(AllPermissions.brands.BrandsCreateAny)
  create(@Body() brand: CreateBrandDto): Promise<BrandResponseDto> {
    return this.brandService.createBrand(brand);
  }
  @Patch(':id')
  @RequirePermission(AllPermissions.brands.BrandsUpdateAny)
  rename(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() name: RenameBrandDto,
  ): Promise<BrandResponseDto> {
    return this.brandService.renameBrand(id, name);
  }
  @Get(':id')
  @RequirePermission(AllPermissions.brands.BrandsReadAny)
  findById(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<BrandResponseDto> {
    return this.brandService.findById(id);
  }
  @Get()
  @RequirePermission(AllPermissions.brands.BrandsReadAny)
  findAll(@Query() dto: FindAllBrandsFilterDto): Promise<BrandResponseDto[]> {
    return this.brandService.findAll(dto);
  }

  @Post('batch-delete')
  @RequirePermission(AllPermissions.brands.BrandsDeleteAny)
  removeMany(@Body() dto: RemoveBrandsDto): Promise<RemoveBrandsResponseDto> {
    return this.brandService.removeMany(dto);
  }
  @Get(':id/images')
  @RequirePermission(AllPermissions.images.ImagesReadAny)
  async findBanners(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<ImageResponseDto[]> {
    return this.brandService.findBanners(id);
  }
  @Post(':id/images')
  @RequirePermission(AllPermissions.images.ImagesAttachAny)
  attachImages(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    dto: AttachImagesToBrandDto,
  ): Promise<ImageResponseDto[]> {
    return this.brandService.attachImages(id, dto);
  }
}
