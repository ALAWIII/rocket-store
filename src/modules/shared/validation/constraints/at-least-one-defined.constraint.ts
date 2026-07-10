import {
  ValidationArguments,
  ValidatorConstraintInterface,
  ValidatorConstraint,
} from 'class-validator';

@ValidatorConstraint({
  name: 'atLeastOneDefined',
})
export class AtLeastOneDefinedConstraint implements ValidatorConstraintInterface {
  private fields: string[] = [];

  constructor(defaultFields?: string[]) {
    this.fields = defaultFields ?? [];
  }
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as Record<string, unknown>;
    return this.fields.some((field) => dto[field] !== undefined);
  }

  defaultMessage(args: ValidationArguments): string {
    return `At least one of these fields must be defined: ${this.fields.join(', ')}`;
  }
}
