import { Err, Ok, Result } from 'ts-results-es';
import { ValueObjectError } from './value-object.error';

export class FileName {
  private constructor(private readonly _value: string) {}

  static create(
    value: string,
    maxLength = 50,
  ): Result<FileName, ValueObjectError> {
    const v = value.trim();

    if (!v) return Err(new ValueObjectError('file name is required'));
    if (v.length < 2 || v.length > maxLength)
      return Err(
        new ValueObjectError(
          `file name must be between 2 and ${maxLength} characters`,
        ),
      );

    const fileNameRegex =
      /^(?!\.{1,2}$)[\p{L}\p{N}][\p{L}\p{N} ._'()-]*[\p{L}\p{N}]$/u;
    if (!fileNameRegex.test(v))
      return Err(new ValueObjectError('Invalid file name'));

    return Ok(new FileName(v));
  }

  get value(): string {
    return this._value;
  }
  toJSON() {
    return this.value;
  }
}
