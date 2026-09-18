import { Result } from '@allawiii/results-ts';
import { Name } from './name';
import { ValueObjectError } from './value-object.error';

export const brandRegex = /^[\p{L}\p{N}]+(?:[- '&.][\p{L}\p{N}]+)*$/u;

export class BrandName extends Name {
  static create(value: string): Result<BrandName, ValueObjectError> {
    const result = Name.create(value, 50, brandRegex);

    return result.map((name) => new BrandName(name.value));
  }
}
