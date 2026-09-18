import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class DetachBrandImagesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  imageIds!: string[];
}
