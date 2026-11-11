import { IsInt, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { type JsonObject } from 'src/modules/shared/value-objects/json-object';

export class CreateProductVariantDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description: string | null = null;

  @IsObject()
  info!: JsonObject;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}
