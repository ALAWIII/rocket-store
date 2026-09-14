import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class RemoveUnusedImagesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  imageIds!: string[];
}
