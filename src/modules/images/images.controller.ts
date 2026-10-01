import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { ImageResponseDto } from '../shared/dto/image-response.dto';
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
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() fileInfo: UploadFileInfoDto,
    @Session() session: AppSession,
  ): Promise<ImageResponseDto> {
    return this.imagesService
      .upload(file, session.user.id, fileInfo)
      .map((v) => v.toJSON())
      .unwrap();
  }
  @Get('unused')
  @RequirePermission(AllPermissions.images.ImagesReadAny)
  findUnused(
    @Query() filters: FindUnusedImagesDto,
  ): Promise<FindUnusedImagesResponseDto> {
    return this.imagesService
      .findUnusedImages(filters)
      .map((v) => {
        return {
          pagination: v.pagination,
          images: v.images.map((img) => img.toJSON()),
        };
      })
      .unwrap();
  }
  @Post('batch-delete')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(AllPermissions.images.ImagesDeleteAny)
  async removeImages(
    @Body() ids: RemoveImagesDto,
  ): Promise<RemoveImagesResponseDto> {
    return (await this.imagesService.removeImages(ids.imageIds)).unwrap();
  }
  @Delete('unused')
  @RequirePermission(AllPermissions.images.ImagesDeleteAny)
  async removeUnused(): Promise<RemoveImagesResponseDto> {
    return (await this.imagesService.removeUnusedImages()).unwrap();
  }
  @Get(':id')
  @RequirePermission(AllPermissions.images.ImagesReadAny)
  findById(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<ImageResponseDto> {
    return this.imagesService
      .findImageById(id)
      .map((v) => v.toJSON())
      .unwrap();
  }
}
