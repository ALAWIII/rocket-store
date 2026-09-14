import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { RequirePermission } from '../shared/authorization/decorators/require-permission.decorator';
import { ImagesService } from './images.service';
import { AllPermissions } from '../access-control/domain/permission';
import { ImageResponseDto } from './dto/image-response.dto';

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
}
