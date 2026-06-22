import { BrandId } from 'src/modules/shared/domain/ids';
import { Name } from 'src/modules/shared/value-objects/name';

type BrandData = {
  readonly id: BrandId;
  name: Name;
  createdAt: Date;
};

export class Brand {
  private constructor(private data: BrandData) {}

  static create(data: { id: BrandId; name: Name }): Brand {
    return new Brand({
      ...data,
      createdAt: new Date(),
    });
  }
  static restore(data: BrandData): Brand {
    return new Brand(data);
  }

  get id(): BrandId {
    return this.data.id;
  }

  get name(): Name {
    return this.data.name;
  }

  rename(name: Name): void {
    if (this.name.value === name.value) return;

    this.data.name = name;
  }
  toJSON() {
    return {
      id: this.data.id,
      name: this.data.name,
    };
  }
}
