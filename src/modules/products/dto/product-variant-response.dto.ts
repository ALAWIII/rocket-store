import { JsonObject } from 'src/modules/shared/value-objects/json-object';
import { ProductStatus } from '../domain/product-status';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';

export class ProductVariantResponseDto {
  id!: string;
  productId!: string;
  price!: number;
  quantity!: number;
  description!: string | null;
  status!: ProductStatus;
  info!: JsonObject;
  images?: ImageResponseDto[];
  sortOrder!: number;
  createdAt!: Date | string;
  updatedAt!: Date | string;
}
