export class ValueObjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValueObjectError';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
