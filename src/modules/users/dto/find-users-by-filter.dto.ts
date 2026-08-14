import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Length,
  IsInt,
  Min,
  IsEmail,
  IsUUID,
  Matches,
} from 'class-validator';

export class FindUsersFlatQueryDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID('7')
  roleId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{3,15}$/, {
    message: 'phone must be a valid E.164 phone number',
  })
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
