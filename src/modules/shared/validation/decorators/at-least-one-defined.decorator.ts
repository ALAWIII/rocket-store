import { registerDecorator, ValidationOptions } from 'class-validator';
import { AtLeastOneDefinedConstraint } from '../constraints/at-least-one-defined.constraint';

export function AtLeastOneDefined(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOneDefined',
      target: object.constructor,
      propertyName,
      constraints: [fields],
      options: validationOptions,
      validator: AtLeastOneDefinedConstraint,
    });
  };
}
