import { registerDecorator, ValidationOptions } from 'class-validator';
import { AtLeastOneDefinedConstraint } from '../constraints/at-least-one-defined.constraint';

export function AtLeastOneDefined(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyKey: string | symbol) => {
    registerDecorator({
      name: 'atLeastOneDefined',
      target: object.constructor,
      propertyName: propertyKey.toString(),
      constraints: [fields],
      options: validationOptions,
      validator: AtLeastOneDefinedConstraint,
    });
  };
}
