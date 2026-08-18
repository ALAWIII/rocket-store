import { Err, Ok, Result } from 'ts-results-es';
import { ValueObjectError } from './value-object.error';

export class Dimension {
  private constructor(private readonly _value: number) {}

  static create(
    value: number,
    max = 4096,
  ): Result<Dimension, ValueObjectError> {
    if (!Number.isSafeInteger(value) || value <= 0) {
      return Err(new ValueObjectError('size must be a positive integer'));
    }

    if (value > max) {
      return Err(new ValueObjectError(`size must not exceed ${max}px`));
    }

    return Ok(new Dimension(value));
  }

  get value(): number {
    return this._value;
  }

  toJSON(): number {
    return this.value;
  }
}

export type Width = Dimension;
export type Height = Dimension;
