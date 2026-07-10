import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Permission } from 'src/modules/access-control/domain/permission';

@ValidatorConstraint({ name: 'isValidPermission', async: false })
export class IsValidPermissionConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as {
      entity?: string;
      action?: string;
      scope?: string;
    };

    if (!dto.entity || !dto.action || !dto.scope) {
      return false;
    }

    try {
      Permission.fromString(`${dto.entity}.${dto.action}.${dto.scope}`);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Invalid permission combination: entity, action, and scope do not match';
  }
}
