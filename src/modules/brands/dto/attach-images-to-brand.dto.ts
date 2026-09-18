import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { type BrandImageRole } from '../domain/brand-image';

class AttachBrandImageDto {
  @IsUUID('7')
  imageId!: string;
  @IsIn(['logo', 'banner'])
  imageRole!: BrandImageRole;
}

export class AttachImagesToBrandDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  images!: AttachBrandImageDto[];
}
