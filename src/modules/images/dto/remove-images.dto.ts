import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class RemoveImagesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  imageIds!: string[];
}
