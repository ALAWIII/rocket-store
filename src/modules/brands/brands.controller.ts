import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandsService } from './brands.service';
import { BrandResponseDto } from './dto/brand-response.dto';
import { AllPermissions } from '../access-control/domain/permission';
import { RenameBrandDto } from './dto/rename-brand.dto';

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
}
