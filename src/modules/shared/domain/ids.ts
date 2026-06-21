import { v7, validate, version } from 'uuid';

export abstract class UuidV7Id {
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
  toJSON() {
    return this.value;
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
export class OrderItemId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new OrderItemId(id);
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
export class ProductVariantId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new ProductVariantId(id);
  }
}
export class PageTemplateId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new PageTemplateId(id);
  }
}
export class CategoryId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new CategoryId(id);
  }
}
export class CartItemId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new CartItemId(id);
  }
}
export class AddressId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new AddressId(id);
  }
}

export class PaymentId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new PaymentId(id);
  }
}

export class PaymentTransactionId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new PaymentTransactionId(id);
  }
}

export class PaymentProviderId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new PaymentProviderId(id);
  }
}
export class ShippingProviderId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new ShippingProviderId(id);
  }
}
export class ShipmentId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new ShipmentId(id);
  }
}
export class WishlistId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new WishlistId(id);
  }
}
export class WishlistItemId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new WishlistItemId(id);
  }
}
export class ImageId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new ImageId(id);
  }
}
export class ImageAttachmentId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new ImageAttachmentId(id);
  }
}
export class PromotionId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new PromotionId(id);
  }
}
export class PromotionTargetId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new PromotionTargetId(id);
  }
}
export class PromotionRuleId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new PromotionRuleId(id);
  }
}
export class CouponId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new CouponId(id);
  }
}
export class PromotionRedemptionId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new PromotionRedemptionId(id);
  }
}
export class ReviewId extends UuidV7Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    const id = value ?? v7();
    super.validate(id);
    return new ReviewId(id);
  }
}
