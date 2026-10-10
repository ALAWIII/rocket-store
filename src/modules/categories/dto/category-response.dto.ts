import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';

export class CategoryResponseDto {
  id!: string;
  name!: string;
  path!: string[];
  parentId!: string | null;
  description?: string | null;
  icon?: ImageResponseDto;
  thumbnail?: ImageResponseDto;
  createdAt!: Date | string;
  updatedAt!: Date | string;
}
