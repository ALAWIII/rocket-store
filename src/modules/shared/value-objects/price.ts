import { Err, Ok, Result } from '@allawiii/results-ts';
import { ValueObjectError } from './value-object.error';
export const MAX_PRICE = 1_000_000_000; //$10,000,000.00 (10 million dollars).
export class Price {
  private constructor(private readonly _price: number) {}

  static create(price: number, maxPrice = MAX_PRICE): Result<Price, ValueObjectError> {
    if (!Number.isSafeInteger(price) || price < 0 || price > maxPrice)
      return Err(new ValueObjectError('Price should be within $0 to $10,000,000.00 range.'));

    return Ok(new Price(price));
  }

  get value(): number {
    return this._price;
  }
  toJSON() {
    return this.value;
  }
}
