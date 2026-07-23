import { IsString } from 'class-validator';
import { IsValidPermission } from 'src/modules/shared/validation/decorators/is-valid-permission.decorator';

export class PermissionDto {
  @IsString()
  entity!: string;

  @IsString()
  action!: string;

  @IsString()
  visibility!: string;

  @IsValidPermission()
  private readonly __permissionCheck?: never;
}
