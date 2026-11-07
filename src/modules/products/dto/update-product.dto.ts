import { IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { PRODUCT_STATUS, type ProductStatus } from '../domain/product-status';
import { AtLeastOneDefined } from 'src/modules/shared/validation/decorators/at-least-one-defined.decorator';
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
  @IsIn(PRODUCT_STATUS)
  status?: ProductStatus;
  @AtLeastOneDefined(productFieldsList, {
    message: `At least one field must be provided: (${productFields}).`,
  })
  private readonly __atLeastOneDefined?: never;
}
