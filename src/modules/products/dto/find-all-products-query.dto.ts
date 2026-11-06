import { PRODUCT_STATUS, type ProductStatus } from '../domain/product-status';

import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class FindAllProductsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(PRODUCT_STATUS)
  status?: ProductStatus;

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
