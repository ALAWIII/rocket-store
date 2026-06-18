import {
  PromotionId,
  PromotionTargetId,
  UuidV7Id,
} from 'src/shared/domain/ids';
import { ValueOf } from 'src/shared/types/value-of';

export const PROMOTION_TARGET_TYPE = {
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY',
  BRAND: 'BRAND',
  ORDER: 'ORDER',
  SHIPPING: 'SHIPPING',
} as const;

export type PromotionTargetType = ValueOf<typeof PROMOTION_TARGET_TYPE>;

export const PROMOTION_TARGET_MODE = {
  INCLUDE: 'INCLUDE',
  EXCLUDE: 'EXCLUDE',
} as const;

export type PromotionTargetMode = ValueOf<typeof PROMOTION_TARGET_MODE>;

export type PromotionTargetProps = {
  id: PromotionTargetId;
  promotionId: PromotionId;
  type: PromotionTargetType;
  targetId: UuidV7Id;
  mode: PromotionTargetMode;
  createdAt: Date;
};

type CreatePromotionTargetProps = Omit<PromotionTargetProps, 'createdAt'>;

export class PromotionTarget {
  private constructor(private props: PromotionTargetProps) {}

  static create(props: CreatePromotionTargetProps): PromotionTarget {
    return new PromotionTarget({
      ...props,
      mode: props.mode ?? PROMOTION_TARGET_MODE.INCLUDE,
      createdAt: new Date(),
    });
  }

  static restore(props: PromotionTargetProps): PromotionTarget {
    return new PromotionTarget(props);
  }

  changeMode(mode: PromotionTargetMode) {
    this.props.mode = mode;
  }

  get id(): PromotionTargetId {
    return this.props.id;
  }

  get promotionId(): PromotionId {
    return this.props.promotionId;
  }

  get type(): PromotionTargetType {
    return this.props.type;
  }

  get targetId(): UuidV7Id {
    return this.props.targetId;
  }

  get mode(): PromotionTargetMode {
    return this.props.mode;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): PromotionTargetProps {
    return { ...this.props };
  }
}
