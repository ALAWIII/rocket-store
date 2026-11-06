import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

class VariantOrder {
  @IsUUID('7')
  variantId!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class UpdateVariantsSortOrder {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VariantOrder)
  orders!: VariantOrder[];
}
