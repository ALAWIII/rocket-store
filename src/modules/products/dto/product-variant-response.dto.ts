import { JsonObject } from 'src/modules/shared/value-objects/json-object';
import { ProductVisibility } from '../domain/product-visibility';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';

export class ProductVariantResponseDto {
  id!: string;
  productId!: string;
  title!: string;
  price!: number;
  description!: string | null;
  visibility!: ProductVisibility;
  info!: JsonObject;
  images?: ImageResponseDto[];
  sortOrder!: number;
  createdAt!: Date | string;
  updatedAt!: Date | string;
}
