import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { AtLeastOneDefined } from 'src/modules/shared/validation/decorators/at-least-one-defined.decorator';
import { type JsonObject } from 'src/modules/shared/value-objects/json-object';
import { PRODUCT_VISIBILITY, type ProductVisibility } from '../domain/product-visibility';
import { PRODUCT_SALES_STATUS, type ProductSalesStatus } from '../domain/product-sales-status';
import { MAX_PRICE } from 'src/modules/shared/value-objects/price';
import { Exclude } from 'class-transformer';
const productVariantFieldsList = ['price', 'title', 'description', 'info', 'salesStatus', 'visibility'];
const productVariantFields = productVariantFieldsList.join(', ');
export class UpdateProductVariantDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE) //$10,000,000.00 (10 million dollars).
  price?: number;
  @IsOptional()
  @IsString()
  @MaxLength(50)
  title?: string;
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsObject()
  info?: JsonObject;

  @IsOptional()
  @IsIn(PRODUCT_VISIBILITY)
  visibility?: ProductVisibility;

  @IsOptional()
  @IsIn(PRODUCT_SALES_STATUS)
  salesStatus?: ProductSalesStatus;
  @AtLeastOneDefined(productVariantFieldsList, {
    message: `At least one field must be provided: (${productVariantFields}).`,
  })
  @Exclude()
  readonly __atLeastOneDefined?: never;
}
