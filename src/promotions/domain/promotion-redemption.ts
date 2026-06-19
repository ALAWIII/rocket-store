import {
  CouponId,
  OrderId,
  PromotionId,
  PromotionRedemptionId,
  UserId,
} from 'src/shared/domain/ids';

type PromotionRedemptionProps = {
  id: PromotionRedemptionId;
  promotionId: PromotionId;
  orderId: OrderId;
  couponId: CouponId | null;
  userId: UserId | null;
  discountAmount: number;
  redeemedAt: Date;
};

type CreatePromotionRedemptionProps = Omit<
  PromotionRedemptionProps,
  'redeemedAt'
>;

export class PromotionRedemption {
  private constructor(private props: PromotionRedemptionProps) {}

  static create(data: CreatePromotionRedemptionProps): PromotionRedemption {
    if (data.discountAmount < 0) {
      throw new Error('PromotionRedemption discountAmount cannot be negative.');
    }

    return new PromotionRedemption({
      ...data,
      couponId: data.couponId ?? null,
      userId: data.userId ?? null,
      redeemedAt: new Date(),
    });
  }

  static restore(data: PromotionRedemptionProps): PromotionRedemption {
    if (data.discountAmount < 0) {
      throw new Error('PromotionRedemption discountAmount cannot be negative.');
    }

    return new PromotionRedemption({
      ...data,
      couponId: data.couponId ?? null,
      userId: data.userId ?? null,
    });
  }

  get id(): PromotionRedemptionId {
    return this.props.id;
  }

  get promotionId(): PromotionId {
    return this.props.promotionId;
  }

  get couponId(): CouponId | null | undefined {
    return this.props.couponId;
  }

  get orderId(): OrderId {
    return this.props.orderId;
  }

  get userId(): UserId | null | undefined {
    return this.props.userId;
  }

  get discountAmount(): number {
    return this.props.discountAmount;
  }

  get redeemedAt(): Date {
    return this.props.redeemedAt;
  }

  hasCoupon(): boolean {
    return this.props.couponId != null;
  }

  isGuestRedemption(): boolean {
    return this.props.userId == null;
  }

  toJSON(): PromotionRedemptionProps {
    return {
      ...this.props,
      couponId: this.props.couponId ?? null,
      userId: this.props.userId ?? null,
      redeemedAt: new Date(this.props.redeemedAt),
    };
  }
}
