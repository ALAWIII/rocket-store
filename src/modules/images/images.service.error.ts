export class ImageServiceError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class CorruptedUploadedImageError extends ImageServiceError {}
export class ImageMaxSizeExceededError extends ImageServiceError {
  constructor(public readonly maxSizeBytes: number) {
    super(`File exceeds maximum size of ${maxSizeBytes} bytes`);
  }
}
export class ImageNotFoundError extends ImageServiceError {}
export class ImagePersistenceDatabaseError extends ImageServiceError {}
