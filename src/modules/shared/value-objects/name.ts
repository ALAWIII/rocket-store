import { Err, Ok, Result } from '@allawiii/results-ts';
import { ValueObjectError } from './value-object.error';

export class Name {
  protected constructor(private readonly _value: string) {}

  static create(
    value: string,
    maxLength = 50,
    customRegex = /^[a-zA-ZÀ-ÿ]+([ '-][a-zA-ZÀ-ÿ]+)*$/,
  ): Result<Name, ValueObjectError> {
    const v = value.trim();

    if (!v) return Err(new ValueObjectError('Name is required'));
    if (v.length < 2 || v.length > maxLength)
      return Err(
        new ValueObjectError(
          `Name must be between 2 and ${maxLength} characters`,
        ),
      );

    if (!customRegex.test(v)) return Err(new ValueObjectError('Invalid name'));

    return Ok(new Name(v));
  }

  get value(): string {
    return this._value;
  }
  toJSON() {
    return this.value;
  }
}
