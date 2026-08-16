import { v7, validate, version } from 'uuid';
import { IdError } from './id.error';

export abstract class UuidV7Id {
  protected constructor(private readonly value: string) {}

  protected static validate(value: string) {
    if (!validate(value) || version(value) !== 7) {
      throw new IdError(`${this.name} must be UUID v7`);
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
export class Id extends UuidV7Id {
  constructor(value: string) {
    super(value);
  }

  static create<T extends typeof Id>(this: T, value?: string): InstanceType<T> {
    const id = value ?? v7();
    this.validate(id); // 'this' is the subclass (OrderId, UserId, ...)
    return new this(id) as InstanceType<T>;
  }
}
export class UserId extends Id {}
export class RoleId extends Id {}
export class ProductId extends Id {}
export class ProductVariantId extends Id {}
export class OrderId extends Id {}
export class OrderItemId extends Id {}
export class ImageId extends Id {}
export class ImageAttachmentId extends Id {}
export class BrandId extends Id {}
export class BrandImageId extends Id {}
export class PageTemplateId extends Id {}
export class CategoryId extends Id {}
export class CartItemId extends Id {}
export class AddressId extends Id {}
export class PaymentId extends Id {}
export class PaymentTransactionId extends Id {}
export class PaymentProviderId extends Id {}
export class ShippingProviderId extends Id {}
export class ShipmentId extends Id {}
export class WishlistId extends Id {}
export class WishlistItemId extends Id {}
export class PromotionId extends Id {}
export class PromotionTargetId extends Id {}
export class PromotionRuleId extends Id {}
export class CouponId extends Id {}
export class PromotionRedemptionId extends Id {}
export class ReviewId extends Id {}
export class AuditLogId extends Id {}
export class CartId extends Id {}
