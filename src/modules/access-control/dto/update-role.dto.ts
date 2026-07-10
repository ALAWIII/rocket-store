import { PermissionDto } from './permission.dto';
import { IsArray, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRoleDto {
  @Length(2, 50)
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions!: PermissionDto[];
}
