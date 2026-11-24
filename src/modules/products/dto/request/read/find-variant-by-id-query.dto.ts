import { IsIn, IsOptional } from 'class-validator';
import { PRODUCT_VISIBILITY, type ProductVisibility } from '../../../domain/product-visibility';

export class FindVariantByIdQueryDto {
  @IsOptional()
  @IsIn(PRODUCT_VISIBILITY)
  visibility?: ProductVisibility;
}
