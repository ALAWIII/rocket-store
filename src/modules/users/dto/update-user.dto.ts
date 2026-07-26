import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateUserDto {
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
  @Length(2, 25)
  roleId?: string;
  @IsOptional()
  @IsString()
  @Length(2, 20)
  phone?: string;
}
