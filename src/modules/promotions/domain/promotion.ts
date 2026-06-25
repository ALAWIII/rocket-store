import { PromotionId, UserId } from 'src/modules/shared/domain/ids';
import { ValueOf } from 'src/modules/shared/types/value-of';
import { Name } from 'src/modules/shared/value-objects/name';

export const PromotionType = {
  AUTOMATIC: 'automatic',
  COUPON: 'coupon',
} as const;

export type PromotionType = ValueOf<typeof PromotionType>;

export const DiscountType = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_SHIPPING: 'free_shipping',
} as const;

export type DiscountType = ValueOf<typeof DiscountType>;

export const PromotionStatus = {
  ACTIVE: 'active',
  SCHEDULED: 'scheduled',
  EXPIRED: 'expired',
  DISABLED: 'disabled',
} as const;

export type PromotionStatus = ValueOf<typeof PromotionStatus>;

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
  createdAt: Date;
  updatedAt: Date;
};

type CreatePromotionProps = Omit<
  PromotionProps,
  'usageCount' | 'createdAt' | 'updatedAt' | 'status'
>;

export class Promotion {
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
      status: this.resolveStatus(now, props.startsAt, props.endsAt),
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

  rename(name: Name) {
    this.props.name = name;
    this.touch();
  }

  changeDescription(description?: string | null) {
    this.props.description = description ?? null;
    this.touch();
  }

  changeDiscount(value: number, maxDiscountAmount?: number | null) {
    Promotion.validateDiscount(
      this.props.discountType,
      value,
      maxDiscountAmount,
    );

    this.props.value = value;
    this.props.maxDiscountAmount = maxDiscountAmount ?? null;
    this.touch();
  }

  changeDiscountType(discountType: DiscountType) {
    Promotion.validateDiscount(
      discountType,
      this.props.value,
      this.props.maxDiscountAmount,
    );

    this.props.discountType = discountType;
    this.touch();
  }

  reschedule(startsAt?: Date | null, endsAt?: Date | null) {
    Promotion.validateDates(startsAt, endsAt);

    this.props.startsAt = startsAt ?? null;
    this.props.endsAt = endsAt ?? null;
    this.props.status = Promotion.resolveStatus(
      new Date(),
      this.props.startsAt,
      this.props.endsAt,
      this.props.status,
    );
    this.touch();
  }

  changeLimits(usageLimit?: number | null, perUserLimit?: number | null) {
    Promotion.validateLimits(usageLimit, perUserLimit);

    this.props.usageLimit = usageLimit ?? null;
    this.props.perUserLimit = perUserLimit ?? null;
    this.touch();
  }

  changePriority(priority: number) {
    Promotion.validatePriority(priority);

    this.props.priority = priority;
    this.touch();
  }

  enableStacking() {
    this.props.stackable = true;
    this.touch();
  }

  disableStacking() {
    this.props.stackable = false;
    this.touch();
  }

  activate() {
    if (this.props.status !== PromotionStatus.DISABLED) return;

    this.props.status = Promotion.resolveStatus(
      new Date(),
      this.props.startsAt,
      this.props.endsAt,
    );
    this.touch();
  }

  disable() {
    if (this.props.status === PromotionStatus.EXPIRED) return;

    this.props.status = PromotionStatus.DISABLED;
    this.touch();
  }

  refreshStatus(now = new Date()) {
    this.props.status = Promotion.resolveStatus(
      now,
      this.props.startsAt,
      this.props.endsAt,
      this.props.status,
    );
    this.touch();
  }

  increaseUsageCount(by = 1) {
    if (by <= 0) throw new Error('Usage increment must be greater than 0');

    this.refreshStatus();

    if (this.props.status !== PromotionStatus.ACTIVE) {
      throw new Error('Promotion is not active');
    }

    if (
      this.props.usageLimit != null &&
      this.props.usageCount + by > this.props.usageLimit
    ) {
      throw new Error('Promotion usage limit exceeded');
    }

    this.props.usageCount += by;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  private static validateDiscount(
    discountType: DiscountType,
    value: number,
    maxDiscountAmount?: number | null,
  ): void {
    if (value <= 0) throw new Error('Promotion value must be greater than 0');

    if (discountType === DiscountType.PERCENTAGE && value > 100) {
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
    currentState?: PromotionStatus,
  ): PromotionStatus {
    if (currentState === PromotionStatus.DISABLED)
      return PromotionStatus.DISABLED;
    if (startsAt && startsAt > now) return PromotionStatus.SCHEDULED;
    if (endsAt && endsAt < now) return PromotionStatus.EXPIRED;
    return PromotionStatus.ACTIVE;
  }

  toJSON(): PromotionProps {
    return { ...this.props };
  }
}
