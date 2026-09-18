import { Body, Controller, Post } from '@nestjs/common';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandsService } from './brands.service';
import { BrandResponseDto } from './dto/brand-response.dto';
import { AllPermissions } from '../access-control/domain/permission';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandService: BrandsService) {}
  @Post()
  @RequirePermission(AllPermissions.brands.BrandsCreateAny)
  async create(@Body() brand: CreateBrandDto): Promise<BrandResponseDto> {
    return this.brandService.createBrand(brand);
  }
}
