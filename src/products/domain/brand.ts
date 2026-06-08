export type BrandId = string;

export class Brand {
  constructor(
    private readonly id: BrandId,
    private name: string,
  ) {
    if (!name.trim()) throw new Error('Brand name is required');
  }

  getId(): BrandId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  rename(name: string): void {
    if (!name.trim()) throw new Error('Brand name is required');
    this.name = name;
  }
}
