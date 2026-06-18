export abstract class PromotionRuleType<T> {
  abstract readonly kind: string;

  constructor(protected readonly props: T) {}

  toJSON() {
    return {
      kind: this.kind,
      ruleData: { ...this.props },
    };
  }
}

export type MinOrderAmountProps = {
  amount: number;
  currency: string;
};

export class MinOrderAmount extends PromotionRuleType<MinOrderAmountProps> {
  readonly kind = 'MIN_ORDER_AMOUNT';

  constructor(props: MinOrderAmountProps) {
    super(props);
  }
}

export type MinQuantityProps = {
  quantity: number;
};

export class MinQuantity extends PromotionRuleType<MinQuantityProps> {
  readonly kind = 'MIN_QUANTITY';

  constructor(props: MinQuantityProps) {
    super(props);
  }
}

export type ProductInCartProps = {
  productIds: string[];
};

export class ProductInCart extends PromotionRuleType<ProductInCartProps> {
  readonly kind = 'PRODUCT_IN_CART';

  constructor(props: ProductInCartProps) {
    super(props);
  }
}

export type CategoryInCartProps = {
  categoryIds: string[];
};

export class CategoryInCart extends PromotionRuleType<CategoryInCartProps> {
  readonly kind = 'CATEGORY_IN_CART';

  constructor(props: CategoryInCartProps) {
    super(props);
  }
}

export type BrandInCartProps = {
  brandIds: string[];
};

export class BrandInCart extends PromotionRuleType<BrandInCartProps> {
  readonly kind = 'BRAND_IN_CART';

  constructor(props: BrandInCartProps) {
    super(props);
  }
}

export type FirstOrderProps = Record<string, never>;

export class FirstOrder extends PromotionRuleType<FirstOrderProps> {
  readonly kind = 'FIRST_ORDER';

  constructor(props: FirstOrderProps = {}) {
    super(props);
  }
}

export type CustomerSegmentProps = {
  segmentIds: string[];
};

export class CustomerSegment extends PromotionRuleType<CustomerSegmentProps> {
  readonly kind = 'CUSTOMER_SEGMENT';

  constructor(props: CustomerSegmentProps) {
    super(props);
  }
}

export type ShippingMethodProps = {
  shippingMethodIds: string[];
};

export class ShippingMethod extends PromotionRuleType<ShippingMethodProps> {
  readonly kind = 'SHIPPING_METHOD';

  constructor(props: ShippingMethodProps) {
    super(props);
  }
}

export type PaymentMethodProps = {
  paymentMethodIds: string[];
};

export class PaymentMethod extends PromotionRuleType<PaymentMethodProps> {
  readonly kind = 'PAYMENT_METHOD';

  constructor(props: PaymentMethodProps) {
    super(props);
  }
}
