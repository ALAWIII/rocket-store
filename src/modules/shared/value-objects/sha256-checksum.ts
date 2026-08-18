import { Err, Ok, Result } from 'ts-results-es';
import { ValueObjectError } from './value-object.error';

export class Sha256Checksum {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<Sha256Checksum, ValueObjectError> {
    const v = value.trim().toLowerCase();

    if (!/^[a-f0-9]{64}$/.test(v)) {
      return Err(new ValueObjectError('checksum must be a SHA-256 hex digest'));
    }

    return Ok(new Sha256Checksum(v));
  }

  get value(): string {
    return this._value;
  }

  toJSON(): string {
    return this.value;
  }
}
