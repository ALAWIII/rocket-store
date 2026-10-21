import { Err, Ok, Result } from '@allawiii/results-ts';
import { ValueObjectError } from './value-object.error';

export class Price {
  private constructor(private readonly _price: number) {}

  static create(price: number): Result<Price, ValueObjectError> {
    if (!Number.isSafeInteger(price) || price < 0) return Err(new ValueObjectError('Price can not be negative.'));

    return Ok(new Price(price));
  }

  get value(): number {
    return this._price;
  }
  toJSON() {
    return this.value;
  }
}
