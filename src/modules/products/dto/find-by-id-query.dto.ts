import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class FindByIdQuery {
  @IsOptional()
  @Transform(({ value }) => (value ? value.split(',') : []))
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @IsIn(['brand', 'categories', 'variants'], { each: true })
  include: string[] = [];
}
