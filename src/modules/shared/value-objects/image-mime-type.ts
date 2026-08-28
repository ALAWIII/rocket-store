import { Err, Ok, Result } from '@allawiii/results-ts';
import { ValueObjectError } from './value-object.error';

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export type ImageMimeTypes = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export class ImageMimeType {
  private constructor(private readonly _value: ImageMimeTypes) {}

  static create(value: string): Result<ImageMimeType, ValueObjectError> {
    const normalized = value.trim().toLowerCase();

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(normalized as ImageMimeTypes)) {
      return Err(new ValueObjectError(`Unsupported image MIME type: ${value}`));
    }

    return Ok(new ImageMimeType(normalized as ImageMimeTypes));
  }

  get value(): ImageMimeTypes {
    return this._value;
  }
  toJSON(): ImageMimeTypes {
    return this.value;
  }
}
