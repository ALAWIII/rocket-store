import { IsOptional, IsString, IsUrl, Length } from 'class-validator';
import { AtLeastOneDefined } from 'src/modules/shared/validation/decorators/at-least-one-defined.decorator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(2, 25)
  name?: string;
  @IsOptional()
  @IsString()
  @Length(2, 25)
  givenName?: string;
  @IsOptional()
  @IsString()
  @Length(2, 25)
  familyName?: string;
  @IsOptional()
  @IsString()
  @IsUrl()
  image?: string;
  @IsOptional()
  @IsString()
  @Length(2, 20)
  phone?: string;

  @AtLeastOneDefined(
    ['name', 'givenName', 'familyName', 'image', 'roleId', 'phone'],
    { message: 'At least one field must be provided' },
  )
  private readonly __atLeast?: never;
}
