import { Err, Ok, Result } from '@allawiii/results-ts';
import { ValueObjectError } from './value-object.error';

export class Quantity {
  private constructor(private readonly _quantity: number) {}

  static create(quantity: number): Result<Quantity, ValueObjectError> {
    if (!Number.isSafeInteger(quantity) || quantity < 0)
      return Err(new ValueObjectError('Quantity can not be negative.'));

    return Ok(new Quantity(quantity));
  }

  get value(): number {
    return this._quantity;
  }
  toJSON() {
    return this.value;
  }
}
