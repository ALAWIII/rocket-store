import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SORT_BY_OPTIONS, type SortByOptions } from 'src/modules/products/application/models/sort-by-options';
import { SORT_DIRECTION, type SortDirection } from 'src/modules/shared/types/sort-direction';
import { PRODUCT_SALES_STATUS, type ProductSalesStatus } from '../domain/product-sales-status';
import { PRODUCT_VISIBILITY, type ProductVisibility } from '../domain/product-visibility';
import { PRODUCT_VARIANT_FIELDS, ProductVariantFields } from '../domain/product-variant';
import { PRODUCT_FIELDS, ProductFields } from '../domain/product';

class FindAllProductsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsUUID('7')
  brandId?: string;

  @IsOptional()
  @IsUUID('7', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  })
  @IsBoolean()
  includeCategoryDescendants?: boolean;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PRODUCT_FIELDS.length)
  @ArrayUnique()
  @IsIn(PRODUCT_FIELDS, { each: true })
  product?: ProductFields[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PRODUCT_VARIANT_FIELDS.length)
  @ArrayUnique()
  @IsIn(PRODUCT_VARIANT_FIELDS, { each: true })
  variant?: ProductVariantFields[];
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsIn(SORT_BY_OPTIONS)
  sortBy: SortByOptions = 'created';

  @IsOptional()
  @IsIn(SORT_DIRECTION)
  sortDirection: SortDirection = 'DESC';

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
export class FindAllCustomerProductsQueryDto extends FindAllProductsQueryDto {}
export class FindAllAdminProductsQueryDto extends FindAllProductsQueryDto {
  @IsOptional()
  @IsIn(PRODUCT_VISIBILITY)
  visibility?: ProductVisibility;
  @IsOptional()
  @IsIn(PRODUCT_SALES_STATUS)
  salesStatus?: ProductSalesStatus;
}
