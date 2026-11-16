import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { ProductVisibility } from '../domain/product-visibility';
import { ProductSalesStatus } from '../domain/product-sales-status';

export class ProductResponseDto {
  id!: string;
  title!: string;
  description!: string;
  brandId!: string | null;
  pageId!: string | null;
  coverImage?: ImageResponseDto;
  visibility?: ProductVisibility;
  salesStatus?: ProductSalesStatus;
  createdAt!: Date | string;
  updatedAt!: Date | string;
}
