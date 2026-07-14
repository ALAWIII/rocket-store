import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Permission } from 'src/modules/access-control/domain/permission';

type PermissionDto = {
  entity?: string;
  action?: string;
  scope?: string;
};
function hasCompletePermissionDto(
  dto: PermissionDto,
): dto is CompletePermissionDto {
  return !!dto.entity && !!dto.action && !!dto.scope;
}

type CompletePermissionDto = Required<PermissionDto>;
@ValidatorConstraint({ name: 'isValidPermission', async: false })
export class IsValidPermissionConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as PermissionDto;
    if (!hasCompletePermissionDto(dto)) {
      return false;
    }
    return Permission.fromPrimitives(dto).isOk();
  }

  defaultMessage(): string {
    return 'Invalid permission combination: entity, action, and scope do not match';
  }
}
