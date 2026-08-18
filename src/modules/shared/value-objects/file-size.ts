import { Err, Ok, Result } from 'ts-results-es';
import { ValueObjectError } from './value-object.error';

export class FileSize {
  private constructor(private readonly _value: number) {}

  static create(
    value: number,
    max = 10 * 1024 * 1024,
  ): Result<FileSize, ValueObjectError> {
    if (!Number.isSafeInteger(value) || value <= 0) {
      return Err(new ValueObjectError('file size must be positive'));
    }

    if (value > max) {
      return Err(
        new ValueObjectError(`file size must not exceed ${max} bytes`),
      );
    }

    return Ok(new FileSize(value));
  }

  get value(): number {
    return this._value;
  }

  toJSON(): number {
    return this.value;
  }
}
