import { v7, validate, version } from 'uuid';
export type ProductVariantId = string;

abstract class UuidV7Id {
  protected constructor(private readonly value: string) {}

  protected static validate(value: string) {
    if (!validate(value) || version(value) !== 7) {
      throw new Error('Id must be UUID v7');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: UuidV7Id): boolean {
    return this.value === other.value;
  }
}

export class UserId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new UserId(id);
  }
}

export class OrderId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new OrderId(id);
  }
}

export class BrandId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new BrandId(id);
  }
}
export class ProductId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new ProductId(id);
  }
}
