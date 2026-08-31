export class ImageStorageError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class MaxSizeExceededError extends ImageStorageError {
  constructor(public readonly maxSizeBytes: number) {
    super(`File exceeds maximum size of ${maxSizeBytes} bytes`);
  }
}
