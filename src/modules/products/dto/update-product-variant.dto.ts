import { IsIn, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { AtLeastOneDefined } from 'src/modules/shared/validation/decorators/at-least-one-defined.decorator';
import { type JsonObject } from 'src/modules/shared/value-objects/json-object';
import { PRODUCT_STATUS, type ProductStatus } from '../domain/product-status';
const productVariantFieldsList = ['price', 'quantity', 'description', 'info', 'status'];
const productVariantFields = productVariantFieldsList.join(', ');
export class UpdateProductVariantDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsObject()
  info?: JsonObject;

  @IsOptional()
  @IsIn(PRODUCT_STATUS)
  status?: ProductStatus;

  @AtLeastOneDefined(productVariantFieldsList, {
    message: `At least one field must be provided: (${productVariantFields}).`,
  })
  private readonly __atLeastOneDefined?: never;
}
