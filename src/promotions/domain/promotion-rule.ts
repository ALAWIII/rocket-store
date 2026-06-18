import { PromotionId, PromotionRuleId } from 'src/shared/domain/ids';
import { ValueOf } from 'src/shared/types/value-of';

export const PROMOTION_RULE_TYPE = {
  MIN_ORDER_AMOUNT: 'MIN_ORDER_AMOUNT',
  MIN_QUANTITY: 'MIN_QUANTITY',
  PRODUCT_IN_CART: 'PRODUCT_IN_CART',
  CATEGORY_IN_CART: 'CATEGORY_IN_CART',
  BRAND_IN_CART: 'BRAND_IN_CART',
  FIRST_ORDER: 'FIRST_ORDER',
  CUSTOMER_SEGMENT: 'CUSTOMER_SEGMENT',
  SHIPPING_METHOD: 'SHIPPING_METHOD',
  PAYMENT_METHOD: 'PAYMENT_METHOD',
} as const;

abstract class PromotionRuleType<T> {
  abstract readonly kind: string;
  constructor(protected readonly props: T) {}
  toJSON() {
    return { kind: this.kind, ruleData: { ...this.props } };
  }
}
type MinOrderAmountProps = {
  amount: number;
  currency: string;
};
export class MinOrderAmount extends PromotionRuleType<MinOrderAmountProps> {
  readonly kind: string = 'MIN_ORDER_AMOUNT';
  constructor(props: MinOrderAmountProps) {
    super(props);
  }
}

export type PromotionRuleProps<T> = {
  id: PromotionRuleId;
  promotionId: PromotionId;
  rule: PromotionRuleType<T>;
  createdAt: Date;
};
export type CreatePromotionRuleProps<T> = Omit<
  PromotionRuleProps<T>,
  'createdAt'
>;
export class PromotionRule<T> {
  private constructor(private readonly props: PromotionRuleProps<T>) {}

  static create<T>(props: CreatePromotionRuleProps<T>): PromotionRule<T> {
    return new PromotionRule({
      ...props,
      createdAt: new Date(),
    });
  }

  static restore<T>(props: PromotionRuleProps<T>): PromotionRule<T> {
    return new PromotionRule(props);
  }

  get id(): PromotionRuleId {
    return this.props.id;
  }

  get promotionId(): PromotionId {
    return this.props.promotionId;
  }
  get rule(): PromotionRuleType<T> {
    return this.props.rule;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
