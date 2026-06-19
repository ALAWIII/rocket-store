import { CouponId, PromotionId, UserId } from 'src/shared/domain/ids';

type CouponProps = {
  id: CouponId;
  code: string; // unique per user
  promotionId: PromotionId; // same for all users in this campaign
  isActive: boolean;
  userId?: UserId | null; // optional: bind to specific user or null for general use.
  createdAt: Date;
};
type CreateCouponProps = Omit<CouponProps, 'createdAt'>;
export class Coupon {
  private constructor(private props: CouponProps) {}

  static create(data: CreateCouponProps): Coupon {
    Coupon.validate(data);

    return new Coupon({
      ...data,
      code: data.code.trim().toUpperCase(),
      createdAt: new Date(),
    });
  }

  static restore(data: CouponProps): Coupon {
    Coupon.validate(data);

    return new Coupon({
      ...data,
      code: data.code.trim().toUpperCase(),
    });
  }

  private static validate(
    data: Omit<CouponProps, 'createdAt'> | CouponProps,
  ): void {
    if (!data.id) throw new Error('Coupon id is required.');
    if (!data.promotionId) throw new Error('Coupon promotionId is required.');
    if (!data.code || !data.code.trim())
      throw new Error('Coupon code is required.');

    const normalizedCode = data.code.trim().toUpperCase();

    if (normalizedCode.length < 6) {
      throw new Error('Coupon code must be at least 6 characters.');
    }

    if (normalizedCode.length > 32) {
      throw new Error('Coupon code must be at most 32 characters.');
    }

    if (!/^[A-Z0-9_-]+$/.test(normalizedCode)) {
      throw new Error('Coupon code format is invalid.');
    }
  }

  get id(): CouponId {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get promotionId(): PromotionId {
    return this.props.promotionId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get userId(): UserId | null | undefined {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  activate(): void {
    if (this.props.isActive) return;
    this.props.isActive = true;
  }

  deactivate(): void {
    if (!this.props.isActive) return;
    this.props.isActive = false;
  }

  assignToUser(userId: UserId): void {
    if (!userId) throw new Error('User id is required.');
    this.props.userId = userId;
  }

  makeGeneral(): void {
    this.props.userId = null;
  }

  belongsToUser(userId: UserId): boolean {
    return this.props.userId === userId;
  }

  isGeneral(): boolean {
    return this.props.userId == null;
  }
  toJSON(): CouponProps {
    return { ...this.props };
  }
}
