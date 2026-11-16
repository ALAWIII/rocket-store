import { PRODUCT_VISIBILITY, type ProductVisibility } from '../domain/product-visibility';

import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class FindAllProductsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(PRODUCT_VISIBILITY)
  visibility?: ProductVisibility;

  @IsOptional()
  @IsUUID('7')
  brandId?: string;

  @IsOptional()
  @IsUUID('7', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @Type(() => Boolean)
  includeCategoryDescendants?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
