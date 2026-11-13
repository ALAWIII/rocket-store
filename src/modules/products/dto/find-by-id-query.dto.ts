import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString } from 'class-validator';

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
