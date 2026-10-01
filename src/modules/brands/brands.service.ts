import { Injectable } from '@nestjs/common';
import { IBrandRepository } from './infrastructure/repositories/brand.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { Brand } from './domain/brand';
import { BrandResponseDto } from './dto/brand-response.dto';
import { RenameBrandDto } from './dto/rename-brand.dto';
import { RemoveBrandsDto } from './dto/remove-brands.dto';
import { RemoveBrandsResponseDto } from './dto/remove-brands-response.dto';
import { FindAllBrandsFilterDto } from './dto/find-all-brands-filter.dto';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
import { AttachImagesToBrandDto } from './dto/attach-images-to-brand.dto';
import { BrandImage } from './domain/brand-image';
import { DetachBrandImagesDto } from './dto/detach-images-of-brand.dto';
import { DetachImagesResponseDto } from './dto/detach-images.response.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly brandRepo: IBrandRepository) {}
  createBrand(brandData: CreateBrandDto): Promise<BrandResponseDto> {
    const brand = Brand.create({ name: brandData.name }).unwrap();
    return this.brandRepo
      .create(brand)
      .map((b) => b.toJSON())
      .unwrap();
  }
  renameBrand(
    brandId: string,
    name: RenameBrandDto,
  ): Promise<BrandResponseDto> {
    return this.brandRepo
      .rename(brandId, name.name)
      .map((b) => b.toJSON())
      .unwrap();
  }
  removeMany(brandIds: RemoveBrandsDto): Promise<RemoveBrandsResponseDto> {
    return this.brandRepo
      .deleteMany(brandIds.brandIds)
      .map((v) => {
        return { affected: v };
      })
      .unwrap();
  }
  findById(brandId: string): Promise<BrandResponseDto> {
    return this.brandRepo
      .findById(brandId)
      .map((b) => b.toJSON())
      .unwrap();
  }

  findAll(options: FindAllBrandsFilterDto): Promise<BrandResponseDto[]> {
    return this.brandRepo
      .findAll(options)
      .map((brands) => brands.map((b) => b.toJSON()))
      .unwrap();
  }
  // image related services.
  findBanners(brandId: string): Promise<ImageResponseDto[]> {
    return this.brandRepo
      .findBanners(brandId)
      .map((bimgs) => bimgs.map((b) => b.toJSON()))
      .unwrap();
  }
  attachImages(
    brandId: string,
    attachments: AttachImagesToBrandDto,
  ): Promise<ImageResponseDto[]> {
    const brandImages = attachments.images.map((img) =>
      BrandImage.create({ brandId, ...img }).unwrap(),
    );
    return this.brandRepo
      .attachImages(brandImages)
      .map((bimgs) => bimgs.map((b) => b.toJSON()))
      .unwrap();
  }
  detachImages(
    brandId: string,
    imageIds: DetachBrandImagesDto,
  ): Promise<DetachImagesResponseDto> {
    return this.brandRepo
      .detachImages(brandId, imageIds.imageIds)
      .map((v) => {
        return { affected: v };
      })
      .unwrap();
  }
}
