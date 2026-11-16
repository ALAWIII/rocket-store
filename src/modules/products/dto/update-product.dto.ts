import { IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { PRODUCT_VISIBILITY, type ProductVisibility } from '../domain/product-visibility';
import { AtLeastOneDefined } from 'src/modules/shared/validation/decorators/at-least-one-defined.decorator';
import { Exclude } from 'class-transformer';
import { PRODUCT_SALES_STATUS, type ProductSalesStatus } from '../domain/product-sales-status';
const productFieldsList = ['title', 'description', 'brandId', 'pageId', 'status'];
const productFields = productFieldsList.join(', ');

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @IsUUID('7')
  brandId?: string | null;
  @IsOptional()
  @IsUUID('7')
  pageId?: string | null;

  @IsOptional()
  @IsIn(PRODUCT_VISIBILITY)
  visibility?: ProductVisibility;
  @IsOptional()
  @IsIn(PRODUCT_SALES_STATUS)
  salesStatus?: ProductSalesStatus;
  @AtLeastOneDefined(productFieldsList, {
    message: `At least one field must be provided: (${productFields}).`,
  })
  @Exclude()
  readonly __atLeastOneDefined?: never;
}
