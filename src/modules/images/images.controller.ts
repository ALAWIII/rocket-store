import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { ImagesService } from './images.service';
import { AllPermissions } from '../access-control/domain/permission';
import { ImageResponseDto } from './dto/image-response.dto';
import { FindUnusedImagesDto } from './dto/find-unused-images-pagination.dto';
import { FindUnusedImagesResponseDto } from './dto/find-unused-images-response.dto';
import { RemoveImagesDto } from './dto/remove-images.dto';
import { RemoveImagesResponseDto } from './dto/remove-images-response.dto';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}
  @Get(':id')
  @RequirePermission(AllPermissions.images.ImagesReadAny)
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<ImageResponseDto> {
    return (await this.imagesService.findImageById(id)).unwrap().toJSON();
  }
  @Get('unused')
  @RequirePermission(AllPermissions.images.ImagesReadAll)
  async findUnused(
    @Query() filters: FindUnusedImagesDto,
  ): Promise<FindUnusedImagesResponseDto> {
    const findImgs = (
      await this.imagesService.findUnUsedImages(filters)
    ).unwrap();
    return {
      pagination: findImgs.pagination,
      images: findImgs.images.map((img) => img.toJSON()),
    };
  }
  @Delete()
  @RequirePermission(AllPermissions.images.ImagesDeleteAny)
  async removeImages(
    @Body() ids: RemoveImagesDto,
  ): Promise<RemoveImagesResponseDto> {
    return {
      affected: (await this.imagesService.removeImages(ids.imageIds)).unwrap(),
    };
  }
  @Delete('unused')
  @RequirePermission(AllPermissions.images.ImagesDeleteAll)
  async removeUnused(): Promise<RemoveImagesResponseDto> {
    return {
      affected: (await this.imagesService.removeUnUsedImages()).unwrap(),
    };
  }
}
