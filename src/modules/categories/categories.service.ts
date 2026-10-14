import { Injectable } from '@nestjs/common';
import { ICategoryRepository } from './infrastructure/repositories/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './domain/category';
import { CategoryResponseDto } from './dto/category-response.dto';
import { AffectedDeletedResponseDto } from '../shared/dto/affected-deleted-response.dto';
import { UpdateDetailsDto } from './dto/update-details.dto';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
import { AttachImagesToCategoryDto } from './dto/attach-images-to-category.dto';
import { CategoryImage } from './domain/category-image';
import { DetachImagesDto } from '../shared/dto/detach-images.dto';
import { DetachImagesResponseDto } from '../shared/dto/detach-images-response.dto';

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
  updateDetails(id: string, data: UpdateDetailsDto): Promise<CategoryResponseDto> {
    return this.catRepo
      .updateDetails(id, data)
      .map((c) => c.toJSON())
      .unwrap();
  }
  moveCategory(id: string, newParentId: string): Promise<CategoryResponseDto> {
    return this.catRepo
      .move(id, newParentId)
      .map((c) => c.toJSON())
      .unwrap();
  }
  delete(id: string, withSubtree: boolean): Promise<AffectedDeletedResponseDto> {
    return this.catRepo
      .delete(id, withSubtree)
      .map((affected) => {
        return { affected };
      })
      .unwrap();
  }
  findBanners(catId: string): Promise<ImageResponseDto[]> {
    return this.catRepo
      .findBanners(catId)
      .map((imgs) => imgs.map((img) => img.toJSON()))
      .unwrap();
  }
  attachImages(categoryId: string, imgs: AttachImagesToCategoryDto): Promise<ImageResponseDto[]> {
    const catImgs = imgs.images.map((img) => CategoryImage.create({ categoryId, ...img }).unwrap());
    return this.catRepo
      .attachImages(catImgs)
      .map((cis) => cis.map((ci) => ci.toJSON()))
      .unwrap();
  }
  detachImages(categoryId: string, imageIds: DetachImagesDto): Promise<DetachImagesResponseDto> {
    return this.catRepo
      .detachImages(categoryId, imageIds.imageIds)
      .map((affected) => {
        return { affected };
      })
      .unwrap();
  }
}
