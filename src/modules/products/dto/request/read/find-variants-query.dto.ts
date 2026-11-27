import { IsIn, IsOptional } from 'class-validator';
import { PRODUCT_VISIBILITY, type ProductVisibility } from '../../../domain/product-visibility';

export class FindVariantsQueryDto {
  @IsOptional()
  @IsIn(PRODUCT_VISIBILITY)
  visibility?: ProductVisibility;
}
