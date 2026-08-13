import { IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';
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
  @Matches(/^\+[1-9]\d{3,14}$/, {
    message: 'phone must be a valid E.164 phone number',
  })
  phone?: string;

  @AtLeastOneDefined(['name', 'givenName', 'familyName', 'image', 'phone'], {
    message: 'At least one field must be provided',
  })
  private readonly __atLeastOneDefined?: never;
}
