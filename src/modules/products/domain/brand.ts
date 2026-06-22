import { BrandId, UserId } from 'src/modules/shared/domain/ids';

type BrandData = {
  readonly id: BrandId;
  name: string;
};

export class Brand {
  private constructor(private data: BrandData) {}

  static create(data: { id: BrandId; name: string; userId: UserId }): Brand {
    const name = Brand.validateName(data.name);
    const now = new Date();
    return new Brand({
      id: data.id,
      name,
    });
  }
  static restore(data: BrandData): Brand {
    return new Brand(data);
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

  rename(name: string, updatedBy: UserId): void {
    const nextName = Brand.validateName(name);
    if (this.data.name === nextName) return;

    this.data.name = nextName;
  }
  toJSON() {
    return {
      id: this.data.id,
      name: this.data.name,
    };
  }
}
