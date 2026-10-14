import { ArrayNotEmpty, IsArray, IsIn, IsUUID, ValidateNested } from 'class-validator';
import { type CategoryImageRole } from '../domain/category-image';

class AttachCategoryImageDto {
  @IsUUID('7')
  imageId!: string;
  @IsIn(['icon', 'banner', 'thumbnail'])
  imageRole!: CategoryImageRole;
}

export class AttachImagesToCategoryDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  images!: AttachCategoryImageDto[];
}
