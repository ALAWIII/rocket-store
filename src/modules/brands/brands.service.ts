import { Injectable } from '@nestjs/common';
import { IBrandRepository } from './infrastructure/repositories/brand.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { Brand } from './domain/brand';
import { BrandResponseDto } from './dto/brand-response.dto';
import { RenameBrandDto } from './dto/rename-brand.dto';
import { RemoveBrandsDto } from './dto/remove-brands.dto';
import { RemoveBrandsResponseDto } from './dto/remove-brands-response.dto';
import { FindByNameDto } from './dto/find-by-name.dto';
import { FindAllBrandsPaginationDto } from './dto/find-all-brands-pagination.dto';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
import { AttachImagesToBrandDto } from './dto/attach-images-to-brand.dto';
import { BrandImage } from './domain/brand-image';

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
  async removeMany(
    brandIds: RemoveBrandsDto,
  ): Promise<RemoveBrandsResponseDto> {
    return {
      affected: (await this.brandRepo.deleteMany(brandIds.brandIds)).unwrap(),
    };
  }
  async findById(brandId: string): Promise<BrandResponseDto> {
    return (await this.brandRepo.findById(brandId)).unwrap().toJSON();
  }
  async findByName(name: FindByNameDto): Promise<BrandResponseDto[]> {
    return (await this.brandRepo.findByName(name.name))
      .unwrap()
      .map((b) => b.toJSON());
  }
  async findAll(
    options: FindAllBrandsPaginationDto,
  ): Promise<BrandResponseDto[]> {
    return (await this.brandRepo.findAll(options))
      .unwrap()
      .map((b) => b.toJSON());
  }
  // image related services.
  async findBanners(brandId: string): Promise<ImageResponseDto[]> {
    return (await this.brandRepo.findBanners(brandId))
      .unwrap()
      .map((bimg) => bimg.toJSON());
  }
  async attachImages(brandId: string, attachments: AttachImagesToBrandDto) {
    const brandImages = attachments.images.map((img) =>
      BrandImage.create({ brandId, ...img }).unwrap(),
    );
    return this.brandRepo.attachImages(brandImages);
  }
}
