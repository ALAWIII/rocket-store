export type BrandId = string;

type BrandData = {
  readonly id: BrandId;
  name: string;
};

export class Brand {
  private constructor(private data: BrandData) {}

  static create(data: { id: BrandId; name: string }): Brand {
    const name = Brand.validateName(data.name);
    return new Brand({ id: data.id, name });
  }

  private static validateName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      throw new Error('Brand name length must be between 2 and 50 characters');
    }
    return trimmed;
  }

  get id(): BrandId {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  rename(name: string): void {
    this.data.name = Brand.validateName(name);
  }
}
