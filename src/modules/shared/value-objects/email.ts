import { Err, Ok, Result } from 'ts-results-es';
import { ValueObjectError } from './value-object.error';

export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<Email, ValueObjectError> {
    const v = value.trim().toLowerCase();

    if (!v) return Err(new ValueObjectError('Email is required'));
    if (v.length > 254) return Err(new ValueObjectError('Email is too long'));

    const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!regex.test(v)) return Err(new ValueObjectError('Invalid Email'));

    return Ok(new Email(v));
  }

  get value(): string {
    return this._value;
  }
  toJSON() {
    return this.value;
  }
}
