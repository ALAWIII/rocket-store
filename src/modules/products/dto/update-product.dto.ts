import { IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { type ProductStatus } from '../domain/product-status';
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
  @IsIn(['active', 'archived'])
  status?: ProductStatus;
}
