import { PromotionId, UserId } from 'src/shared/domain/ids';
import { Name } from 'src/shared/value-objects/name';

export const PROMOTION_TYPE = {
  AUTOMATIC: 'AUTOMATIC',
  COUPON: 'COUPON',
} as const;

export type PromotionType =
  (typeof PROMOTION_TYPE)[keyof typeof PROMOTION_TYPE];

export const DISCOUNT_TYPE = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  FREE_SHIPPING: 'FREE_SHIPPING',
} as const;

export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE];

export const PromotionStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SCHEDULED: 'SCHEDULED',
  EXPIRED: 'EXPIRED',
  DISABLED: 'DISABLED',
} as const;

export type PromotionStatus =
  (typeof PromotionStatus)[keyof typeof PromotionStatus];

type PromotionTargetType =
  | 'PRODUCT'
  | 'CATEGORY'
  | 'BRAND'
  | 'ORDER'
  | 'SHIPPING';

/**
   * | Field        | Purpose                                                                   |
   | ------------ | ------------------------------------------------------------------------- |
   | usageLimit   | Global cap: how many times the promo can be used total (null = unlimited) |
   | usageCount   | How many times it's already been used (tracks against limit)              |
   | perUserLimit | Max times a single customer can use it                                    |
   | stackable    | Can this promo be used with other promos? (true = yes, false = no)        |
   | priority     | Which promo applies first when multiple match (higher = earlier)          |
   | isActive     | Quick toggle to enable/disable without changing status                    |
   */
type PromotionProps = {
  id: PromotionId;
  name: Name;
  description?: string | null;

  type: PromotionType;
  status: PromotionStatus;
  discountType: DiscountType;

  value: number;
  maxDiscountAmount?: number | null; // Without maxDiscountAmount, a 20% discount on a $10,000 item = $2,000 off. With it, you can limit that to $50.

  startsAt?: Date | null;
  endsAt?: Date | null;

  usageLimit?: number | null;
  usageCount: number;
  perUserLimit?: number | null;

  stackable: boolean;
  priority: number;

  createdBy: UserId;
  updatedBy: UserId;

  createdAt: Date;
  updatedAt: Date;
};

type CreatePromotionProps = Omit<
  PromotionProps,
  'usageCount' | 'createdAt' | 'updatedAt' | 'status'
>;

class Promotion {
  private constructor(private props: PromotionProps) {}

  static create(props: CreatePromotionProps): Promotion {
    Promotion.validateDiscount(
      props.discountType,
      props.value,
      props.maxDiscountAmount,
    );
    Promotion.validateDates(props.startsAt, props.endsAt);
    Promotion.validateLimits(props.usageLimit, props.perUserLimit);
    Promotion.validatePriority(props.priority);

    const now = new Date();

    return new Promotion({
      ...props,
      usageCount: 0,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: PromotionProps): Promotion {
    Promotion.validateDiscount(
      props.discountType,
      props.value,
      props.maxDiscountAmount,
    );
    Promotion.validateDates(props.startsAt, props.endsAt);
    Promotion.validateLimits(props.usageLimit, props.perUserLimit);
    Promotion.validatePriority(props.priority);

    return new Promotion(props);
  }

  private static validateDiscount(
    discountType: DiscountType,
    value: number,
    maxDiscountAmount?: number | null,
  ): void {
    if (value <= 0) throw new Error('Promotion value must be greater than 0');

    if (discountType === 'PERCENTAGE' && value > 100) {
      throw new Error('Percentage discount cannot exceed 100');
    }

    if (maxDiscountAmount != null && maxDiscountAmount <= 0) {
      throw new Error('maxDiscountAmount must be greater than 0');
    }
  }

  private static validateDates(
    startsAt?: Date | null,
    endsAt?: Date | null,
  ): void {
    if (startsAt && endsAt && startsAt > endsAt) {
      throw new Error('startsAt cannot be after endsAt');
    }
  }

  private static validateLimits(
    usageLimit?: number | null,
    perUserLimit?: number | null,
  ): void {
    if (usageLimit != null && usageLimit <= 0) {
      throw new Error('usageLimit must be greater than 0');
    }

    if (perUserLimit != null && perUserLimit <= 0) {
      throw new Error('perUserLimit must be greater than 0');
    }

    if (
      usageLimit != null &&
      perUserLimit != null &&
      perUserLimit > usageLimit
    ) {
      throw new Error('perUserLimit cannot exceed usageLimit');
    }
  }

  private static validatePriority(priority: number): void {
    if (priority < 0) {
      throw new Error('priority cannot be negative');
    }
  }

  private static resolveStatus(
    now: Date,
    startsAt?: Date | null,
    endsAt?: Date | null,
  ): PromotionStatus {
    if (startsAt && startsAt > now) return 'SCHEDULED';
    if (endsAt && endsAt < now) return 'EXPIRED';
    return 'ACTIVE';
  }
}
