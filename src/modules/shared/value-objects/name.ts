import { Err, Ok, Result } from 'ts-results-es';
import { InvalidValueObjectError } from './value-object.error';

export class Name {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<Name, InvalidValueObjectError> {
    const v = value.trim();

    if (!v) return Err(new InvalidValueObjectError('Name is required'));
    if (v.length < 2 || v.length > 50)
      return Err(
        new InvalidValueObjectError('Name must be between 2 and 50 characters'),
      );

    const regex = /^[a-zA-ZÀ-ÿ]+([ '-][a-zA-ZÀ-ÿ]+)*$/;
    if (!regex.test(v)) return Err(new InvalidValueObjectError('Invalid name'));

    return Ok(new Name(v));
  }

  get value(): string {
    return this._value;
  }
  toJSON() {
    return this.value;
  }
}
