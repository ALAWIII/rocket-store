import { Err, Ok, Result } from 'ts-results-es';
import { ValueObjectError } from './value-object.error';

export class Name {
  private constructor(private readonly _value: string) {}

  static create(value: string, maxLength = 50): Result<Name, ValueObjectError> {
    const v = value.trim();

    if (!v) return Err(new ValueObjectError('Name is required'));
    if (v.length < 2 || v.length > maxLength)
      return Err(
        new ValueObjectError(
          `Name must be between 2 and ${maxLength} characters`,
        ),
      );

    const regex = /^[a-zA-ZÀ-ÿ]+([ '-][a-zA-ZÀ-ÿ]+)*$/;
    if (!regex.test(v)) return Err(new ValueObjectError('Invalid name'));

    return Ok(new Name(v));
  }

  get value(): string {
    return this._value;
  }
  toJSON() {
    return this.value;
  }
}
