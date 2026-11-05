import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AttachImagesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  imageIds!: string[];
}
