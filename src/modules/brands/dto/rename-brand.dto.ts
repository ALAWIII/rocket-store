import { IsString, Length, Matches } from 'class-validator';
import { brandRegex } from 'src/modules/shared/value-objects/brand-name';

export class RenameBrandDto {
  @IsString()
  @Length(2, 50)
  @Matches(brandRegex, { message: 'Invalid brand name' })
  name!: string;
}
