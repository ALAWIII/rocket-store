import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class RemoveCategoryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  withSubtree: boolean = false;
}
