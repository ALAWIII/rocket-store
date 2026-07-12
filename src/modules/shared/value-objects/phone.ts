import { Err, Ok, Result } from 'ts-results-es';
import { InvalidValueObjectError } from './value-object.error';

export class Phone {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<Phone, InvalidValueObjectError> {
    const v = value.trim();

    const regex = /^\+[1-9]\d{3,14}$/;
    if (!regex.test(v))
      return Err(new InvalidValueObjectError('Invalid phone number'));

    return Ok(new Phone(v));
  }

  get value(): string {
    return this._value;
  }
  toJSON() {
    return this.value;
  }
}
