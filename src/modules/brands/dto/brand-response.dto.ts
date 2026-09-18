import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';

export class BrandResponseDto {
  id!: string;
  name!: string;
  logo?: ImageResponseDto;
  createdAt!: Date;
}
