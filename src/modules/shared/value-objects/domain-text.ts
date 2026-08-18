import { Err, Ok, Result } from 'ts-results-es';
import { ValueObjectError } from './value-object.error';

export class DomainText {
  private constructor(private readonly _value: string) {}

  static create(
    value?: string,
    maxLength = 500,
  ): Result<DomainText | undefined, ValueObjectError> {
    if (value === undefined || value.trim() === '') {
      return Ok(undefined);
    }

    const v = value.trim();

    if (v.length > maxLength) {
      return Err(
        new ValueObjectError(
          `alt text must not exceed ${maxLength} characters`,
        ),
      );
    }

    return Ok(new DomainText(v));
  }

  get value(): string {
    return this._value;
  }

  toJSON(): string {
    return this.value;
  }
}
