import { IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { PRODUCT_SALES_STATUS, type ProductSalesStatus } from 'src/modules/products/domain/product-sales-status';
import { PRODUCT_VISIBILITY, type ProductVisibility } from 'src/modules/products/domain/product-visibility';

export class CreateProductDto {
  @IsString()
  @Length(1, 200)
  title!: string;
  @IsString()
  @MaxLength(10000)
  description!: string;
  @IsOptional()
  @IsUUID('7')
  brandId: string | null = null;
  @IsOptional()
  @IsUUID('7')
  pageId: string | null = null;
  @IsOptional()
  @IsIn(PRODUCT_VISIBILITY)
  visibility?: ProductVisibility = 'private';
  @IsOptional()
  @IsIn(PRODUCT_SALES_STATUS)
  salesStatus?: ProductSalesStatus = 'active';
}
