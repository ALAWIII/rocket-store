import { Err, Ok, Result } from 'ts-results-es';
import { ValueObjectError } from './value-object.error';

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export class ImageMimeType {
  private constructor(private readonly _value: AllowedImageMimeType) {}

  static create(value: string): Result<ImageMimeType, ValueObjectError> {
    const normalized = value.trim().toLowerCase();

    if (
      !ALLOWED_IMAGE_MIME_TYPES.includes(normalized as AllowedImageMimeType)
    ) {
      return Err(new ValueObjectError(`Unsupported image MIME type: ${value}`));
    }

    return Ok(new ImageMimeType(normalized as AllowedImageMimeType));
  }

  get value(): AllowedImageMimeType {
    return this._value;
  }
}
