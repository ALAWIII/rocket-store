export class Name {
  private constructor(private readonly _value: string) {}

  static create(value: string): Name {
    const v = value.trim();

    if (!v) throw new Error('Name is required');
    if (v.length < 2 || v.length > 50) {
      throw new Error('Name must be between 2 and 50 characters');
    }

    const regex = /^[a-zA-ZÀ-ÿ]+([ '-][a-zA-ZÀ-ÿ]+)*$/;
    if (!regex.test(v)) throw new Error('Invalid name');

    return new Name(v);
  }

  get value(): string {
    return this._value;
  }
  toJSON() {
    return this.value;
  }
}
