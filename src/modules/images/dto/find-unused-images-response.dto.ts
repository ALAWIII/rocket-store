import { ImageResponseDto } from './image-response.dto';
import { PaginationResponseDto } from './pagination-response.dto';

export class FindUnusedImagesResponseDto {
  pagination!: PaginationResponseDto;
  images!: ImageResponseDto[];
}
