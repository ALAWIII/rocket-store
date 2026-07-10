import { IsArray, IsString, Length, ValidateNested } from 'class-validator';
import { PermissionDto } from './permission.dto';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  @Length(2, 40)
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions!: PermissionDto[];
}
