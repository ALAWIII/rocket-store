import {
  PromotionId,
  PromotionTargetId,
  UuidV7Id,
} from 'src/modules/shared/domain/ids';
import { ValueOf } from 'src/modules/shared/types/value-of';

export const PromotionTargetType = {
  PRODUCT: 'product',
  CATEGORY: 'category',
  BRAND: 'brand',
  ORDER: 'order',
  SHIPPING: 'shipping',
} as const;

export type PromotionTargetType = ValueOf<typeof PromotionTargetType>;

export const PromotionTargetMode = {
  INCLUDE: 'include',
  EXCLUDE: 'exclude',
} as const;

export type PromotionTargetMode = ValueOf<typeof PromotionTargetMode>;

export type PromotionTargetProps = {
  id: PromotionTargetId;
  promotionId: PromotionId;
  type: PromotionTargetType;
  entityTargetId: UuidV7Id;
  mode: PromotionTargetMode;
  createdAt: Date;
};

type CreatePromotionTargetProps = Omit<PromotionTargetProps, 'createdAt'>;

export class PromotionTarget {
  private constructor(private props: PromotionTargetProps) {}

  static create(props: CreatePromotionTargetProps): PromotionTarget {
    return new PromotionTarget({
      ...props,
      mode: props.mode ?? PromotionTargetMode.INCLUDE,
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
    return this.props.entityTargetId;
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
