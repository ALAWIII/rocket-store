import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsValidPermissionConstraint } from '../constraints/is-valid-permission.constraint';

export function IsValidPermission(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidPermission',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPermissionConstraint,
    });
  };
}
