import { Injectable } from '@nestjs/common';
import { IBrandRepository } from './infrastructure/repositories/brand.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { Brand } from './domain/brand';
import { BrandResponseDto } from './dto/brand-response.dto';
import { RenameBrandDto } from './dto/rename-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly brandRepo: IBrandRepository) {}
  async createBrand(brandData: CreateBrandDto): Promise<BrandResponseDto> {
    const brand = Brand.create({ name: brandData.name }).unwrap();
    return (await this.brandRepo.create(brand)).unwrap().toJSON();
  }
  async renameBrand(
    brandId: string,
    name: RenameBrandDto,
  ): Promise<BrandResponseDto> {
    return (await this.brandRepo.rename(brandId, name.name)).unwrap().toJSON();
  }
}
