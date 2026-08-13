import {
  ValidationArguments,
  ValidatorConstraintInterface,
  ValidatorConstraint,
} from 'class-validator';

@ValidatorConstraint({
  name: 'atLeastOneDefined',
  async: false,
})
export class AtLeastOneDefinedConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as Record<string, unknown>;
    const [fields] = args.constraints as [readonly string[]];

    return fields.some((field) => dto[field] !== undefined);
  }

  defaultMessage(args: ValidationArguments): string {
    const [fields] = args.constraints as [readonly string[]];

    return `At least one of these fields must be defined: ${fields.join(', ')}`;
  }
}
