import { IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PRODUCT_SALES_STATUS, type ProductSalesStatus } from 'src/modules/products/domain/product-sales-status';
import { PRODUCT_VISIBILITY, type ProductVisibility } from 'src/modules/products/domain/product-visibility';
import { type JsonObject } from 'src/modules/shared/value-objects/json-object';

export class CreateProductVariantDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;
  @IsString()
  @MaxLength(50)
  title!: string;
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description: string | null = null;

  @IsObject()
  info!: JsonObject;

  @IsInt()
  @Min(0)
  sortOrder!: number;
  @IsOptional()
  @IsIn(PRODUCT_VISIBILITY)
  visibility?: ProductVisibility = 'private';
  @IsOptional()
  @IsIn(PRODUCT_SALES_STATUS)
  salesStatus?: ProductSalesStatus = 'active';
}
