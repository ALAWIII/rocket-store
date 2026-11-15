import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { ProductVisibility } from '../domain/product-visibility';

export class ProductResponseDto {
  id!: string;
  title!: string;
  description!: string;
  brandId!: string | null;
  pageId!: string | null;
  coverImage?: ImageResponseDto;
  visibility!: ProductVisibility;
  createdAt!: Date | string;
  updatedAt!: Date | string;
}
