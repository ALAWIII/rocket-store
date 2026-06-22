export class Title {
  private constructor(private _title: string) {}
  static create(title: string): Title {
    const normalized = title.trim();
    if (normalized.length < 2 || normalized.length > 100)
      throw new Error(
        'Invalid product title length must be between 2 and 100 characters.',
      );
    return new Title(normalized);
  }
  get title(): string {
    return this._title;
  }
  toJSON() {
    return this._title;
  }
}
