import { IsInt, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { type JsonObject } from 'src/modules/shared/value-objects/json-object';

export class UpdateProductVariantDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsObject()
  info?: JsonObject;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
