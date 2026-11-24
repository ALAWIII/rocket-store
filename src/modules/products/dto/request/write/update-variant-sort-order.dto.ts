import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

class VariantOrderDto {
  @IsUUID('7')
  variantId!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class UpdateVariantsSortOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VariantOrderDto)
  orders!: VariantOrderDto[];
}
