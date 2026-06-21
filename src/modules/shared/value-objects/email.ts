export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Email {
    const v = value.trim().toLowerCase();

    if (!v) throw new Error('Email is required');
    if (v.length > 254) throw new Error('Email is too long');

    const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!regex.test(v)) throw new Error('Invalid email');

    return new Email(v);
  }

  get value(): string {
    return this._value;
  }
  toJSON() {
    return this.value;
  }
}
