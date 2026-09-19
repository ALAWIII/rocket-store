import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { brandRegex } from 'src/modules/shared/value-objects/brand-name';

export class FindAllBrandsFilterDto {
  @IsString()
  @Length(2, 50)
  @Matches(brandRegex, { message: 'Invalid brand name' })
  name?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
