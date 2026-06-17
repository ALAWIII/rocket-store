export class Phone {
  private constructor(private readonly _value: string) {}

  static create(value: string): Phone {
    const v = value.trim();

    const regex = /^\+[1-9]\d{3,14}$/;
    if (!regex.test(v)) throw new Error('Invalid phone number');

    return new Phone(v);
  }

  get value(): string {
    return this._value;
  }
  toJSON() {
    return this.value;
  }
}
