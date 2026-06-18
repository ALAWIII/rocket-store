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

export abstract class PromotionRuleType<T> {
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
