import { LoggableError } from '../errors/error.types';

export class InvalidValueObjectError extends Error implements LoggableError {
  toLog() {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      cause:
        this.cause instanceof Error
          ? {
              name: this.cause.name,
              message: this.cause.message,
              stack: this.cause.stack,
            }
          : this.cause,
    };
  }
}
