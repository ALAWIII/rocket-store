import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

class ProductVariantImageDto {
  @IsUUID('7')
  imageId!: string;
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ProductVariantImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantImageDto)
  images!: ProductVariantImageDto[];
}
