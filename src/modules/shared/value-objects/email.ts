import { Err, Ok, Result } from 'ts-results-es';
import { InvalidValueObjectError } from './value-object.error';

export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<Email, InvalidValueObjectError> {
    const v = value.trim().toLowerCase();

    if (!v) return Err(new InvalidValueObjectError('Email is required'));
    if (v.length > 254)
      return Err(new InvalidValueObjectError('Email is too long'));

    const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!regex.test(v))
      return Err(new InvalidValueObjectError('Invalid Email'));

    return Ok(new Email(v));
  }

  get value(): string {
    return this._value;
  }
  toJSON() {
    return this.value;
  }
}
