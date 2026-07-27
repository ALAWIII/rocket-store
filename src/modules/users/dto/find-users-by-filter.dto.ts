import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Length,
  ValidateNested,
  IsInt,
  Min,
  IsEmail,
  IsUUID,
} from 'class-validator';

class UserFiltersDto {
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
  @Length(2, 20)
  phone?: string;
}

export class FindUsersByQueryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UserFiltersDto)
  filters?: UserFiltersDto;

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
