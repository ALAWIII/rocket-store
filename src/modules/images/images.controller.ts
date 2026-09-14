import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { ImagesService } from './images.service';
import { AllPermissions } from '../access-control/domain/permission';
import { ImageResponseDto } from './dto/image-response.dto';
import { FindUnusedImagesDto } from './dto/find-unused-images-pagination.dto';
import { FindUnusedImagesResponseDto } from './dto/find-unused-images-response.dto';

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
  @Get()
  @RequirePermission(AllPermissions.images.ImagesReadAny)
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
}
