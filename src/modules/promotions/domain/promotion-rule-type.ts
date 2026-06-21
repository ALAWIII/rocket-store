import {
  BrandId,
  CategoryId,
  PaymentProviderId,
  ProductId,
} from 'src/shared/domain/ids';

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

// for example if user buys products with >100$ amount gets 10$ discounts
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
  productIds: ProductId[];
};

export class ProductInCart extends PromotionRuleType<ProductInCartProps> {
  readonly kind = 'PRODUCT_IN_CART';

  constructor(props: ProductInCartProps) {
    super(props);
  }
}

export type CategoryInCartProps = {
  categoryIds: CategoryId[];
};

export class CategoryInCart extends PromotionRuleType<CategoryInCartProps> {
  readonly kind = 'CATEGORY_IN_CART';

  constructor(props: CategoryInCartProps) {
    super(props);
  }
}

export type BrandInCartProps = {
  brandIds: BrandId[];
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

export type PaymentProviderRuleProps = {
  paymentProviderIds: PaymentProviderId[];
};

export class PaymentProviderRule extends PromotionRuleType<PaymentProviderRuleProps> {
  readonly kind = 'PAYMENT_PROVIDER';

  constructor(props: PaymentProviderRuleProps) {
    super(props);
  }
}
