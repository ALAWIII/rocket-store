import { Err, Ok, Result } from 'ts-results-es';
import { InvalidValueObjectError } from './value-object.error';

export class Title {
  private constructor(private _title: string) {}
  static create(title: string): Result<Title, InvalidValueObjectError> {
    const normalized = title.trim();
    if (normalized.length < 2 || normalized.length > 100)
      return Err(
        new InvalidValueObjectError(
          'Invalid product title length must be between 2 and 100 characters.',
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
