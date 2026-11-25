import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  Validate,
  ValidationArguments,
} from 'class-validator';
import { SORT_BY_OPTIONS, type SortByOptions } from 'src/modules/products/application/models/sort-by-options';
import { SORT_DIRECTION, type SortDirection } from 'src/modules/shared/types/sort-direction';

import { normalizeArray } from 'src/modules/shared/utils/array-normalizer.util';
import { trimToUndefined } from 'src/modules/shared/utils/trim-string-or-undefiend.util';
import { MAX_PRICE } from 'src/modules/shared/value-objects/price';
import { IsOptional, IsInt, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { PRODUCT_FIELDS, ProductFields } from 'src/modules/products/domain/product';
import { PRODUCT_VARIANT_FIELDS, ProductVariantFields } from 'src/modules/products/domain/product-variant';
import { PRODUCT_VISIBILITY, type ProductVisibility } from 'src/modules/products/domain/product-visibility';
import { PRODUCT_SALES_STATUS, type ProductSalesStatus } from 'src/modules/products/domain/product-sales-status';

@ValidatorConstraint({ name: 'minLessThanMax', async: false })
export class MinLessThanMax implements ValidatorConstraintInterface {
  validate(maxPrice: number | undefined, args: ValidationArguments) {
    const dto = args.object as { minPrice?: number; maxPrice?: number };

    // If either is missing, the comparison doesn't apply (it's valid)
    if (dto.minPrice == null || maxPrice == null) {
      return true;
    }

    return dto.minPrice <= maxPrice;
  }

  defaultMessage() {
    return 'minPrice must be less than or equal to maxPrice';
  }
}
class FindAllProductsQueryDto {
  @IsOptional()
  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @Length(3, 200)
  search?: string;

  @IsOptional()
  @IsUUID('7')
  brandId?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeArray(value))
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
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
  @Transform(({ value }) => normalizeArray(value))
  @IsArray()
  @ArrayMaxSize(PRODUCT_FIELDS.length)
  @ArrayUnique()
  @IsIn(PRODUCT_FIELDS, { each: true })
  product?: ProductFields[];

  @IsOptional()
  @Transform(({ value }) => normalizeArray(value))
  @IsArray()
  @ArrayMaxSize(PRODUCT_VARIANT_FIELDS.length)
  @ArrayUnique()
  @IsIn(PRODUCT_VARIANT_FIELDS, { each: true })
  variant?: ProductVariantFields[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE) //$10,000,000.00 (10 million dollars).
  @Validate(MinLessThanMax)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE)
  minPrice?: number;

  @IsOptional()
  @IsIn(SORT_BY_OPTIONS)
  sortBy?: SortByOptions;

  @IsOptional()
  @IsIn(SORT_DIRECTION)
  sortDirection?: SortDirection;

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
  @IsIn(PRODUCT_VISIBILITY)
  variantVisibility?: ProductVisibility;
  @IsOptional()
  @IsIn(PRODUCT_SALES_STATUS)
  salesStatus?: ProductSalesStatus;
}
