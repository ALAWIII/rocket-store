import { IsOptional, IsUUID } from 'class-validator';

export class MoveCategoryDto {
  @IsOptional()
  @IsUUID('7')
  parentId: string | null = null;
}
