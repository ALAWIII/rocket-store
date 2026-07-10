import { AtLeastOneDefined } from 'src/modules/shared/validation/decorators/at-least-one-defined.decorator';
import { PermissionDto } from './permission.dto';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRoleDto {
  @IsOptional()
  @Length(2, 50)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions?: PermissionDto[];

  @AtLeastOneDefined(['name', 'permissions'])
  private readonly __atLeastOne?: never;
}
