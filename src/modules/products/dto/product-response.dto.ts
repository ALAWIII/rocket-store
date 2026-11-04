import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { ProductStatus } from '../domain/product-status';

export class ProductResponseDto {
  id!: string;
  title!: string;
  description!: string;
  brandId!: string | null;
  pageId!: string | null;
  coverImage?: ImageResponseDto;
  status!: ProductStatus;
  createdAt!: Date | string;
  updatedAt!: Date | string;
}
