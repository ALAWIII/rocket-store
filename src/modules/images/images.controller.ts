import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { ImagesService } from './images.service';
import { AllPermissions } from '../access-control/domain/permission';
import { ImageResponseDto } from './dto/image-response.dto';
import { FindUnusedImagesDto } from './dto/find-unused-images-pagination.dto';
import { FindUnusedImagesResponseDto } from './dto/find-unused-images-response.dto';
import { RemoveImagesDto } from './dto/remove-images.dto';
import { RemoveImagesResponseDto } from './dto/remove-images-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Session } from '@thallesp/nestjs-better-auth';
import type { AppSession } from 'src/auth/auth.config';
import { UploadFileInfoDto } from './dto/upload-file-info.dto';
import { fileFilter } from './util/file-filter.util';
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @RequirePermission(AllPermissions.images.ImagesUploadAny)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: fileFilter,
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() fileInfo: UploadFileInfoDto,
    @Session() session: AppSession,
  ): Promise<ImageResponseDto> {
    return (await this.imagesService.upload(file, session.user.id, fileInfo))
      .unwrap()
      .toJSON();
  }
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
      await this.imagesService.findUnusedImages(filters)
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
      affected: (await this.imagesService.removeUnusedImages()).unwrap(),
    };
  }
}
