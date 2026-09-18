import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class RemoveBrandsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  brandIds!: string[];
}
