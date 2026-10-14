import { IsUUID } from 'class-validator';

export class MoveCategoryDto {
  @IsUUID('7')
  parentId!: string;
}
