import { Err, Ok, Result } from 'ts-results-es';
import { ValueObjectError } from './value-object.error';

export class Title {
  private constructor(private _title: string) {}
  static create(
    title: string,
    maxLength = 100,
  ): Result<Title, ValueObjectError> {
    const normalized = title.trim();
    if (normalized.length < 2 || normalized.length > maxLength)
      return Err(
        new ValueObjectError(
          `Invalid product title length must be between 2 and ${maxLength} characters.`,
        ),
      );
    return Ok(new Title(normalized));
  }
  get title(): string {
    return this._title;
  }
  toJSON() {
    return this._title;
  }
}
