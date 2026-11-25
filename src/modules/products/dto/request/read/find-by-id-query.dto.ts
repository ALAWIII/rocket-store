import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { PRODUCT_VISIBILITY, type ProductVisibility } from 'src/modules/products/domain/product-visibility';

export class FindByIdQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',');
    return [];
  })
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @IsIn(['brand', 'categories', 'variants'], { each: true })
  include: string[] = [];
}

export class FindByIdQueryAdminDto extends FindByIdQueryDto {
  @IsOptional()
  @IsIn(PRODUCT_VISIBILITY)
  visibility?: ProductVisibility;
  @IsOptional()
  @IsIn(PRODUCT_VISIBILITY)
  variantVisibility?: ProductVisibility;
}
