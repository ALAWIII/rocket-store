import {
  BrandId,
  CategoryId,
  PaymentProviderId,
  ProductId,
} from 'src/modules/shared/domain/ids';
// extend this type with more field types if you encountered new props that requires new types.
type TypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};
type Shape = Record<string, keyof TypeMap>;
type PropsFromShape<S extends Shape> = {
  [K in keyof S]: TypeMap[S[K]];
};

export abstract class PromotionRuleType<T extends Record<string, unknown>> {
  abstract readonly ruleType: string;

  protected constructor(protected readonly props: T) {}
  protected static validateShape(
    data: Record<string, unknown>,
    shape: Shape,
  ): void {
    for (const [key, type] of Object.entries(shape)) {
      if (!(key in data)) throw new Error(`Missing field: ${key}`);
      if (typeof data[key] !== type) {
        throw new Error(`Invalid field: ${key}`);
      }
    }
  }
  toJSON(): T {
    return { ...this.props };
  }
}

// for example if user buys products with >100$ amount gets 10$ discounts
const MinOrderAmountShape = {
  amount: 'number',
  currency: 'string',
} as const;
type MinOrderAmountProps = PropsFromShape<typeof MinOrderAmountShape>;
export class MinOrderAmount extends PromotionRuleType<MinOrderAmountProps> {
  readonly ruleType = 'MIN_ORDER_AMOUNT';

  constructor(props: MinOrderAmountProps) {
    super(props);
  }
  static fromJSON(data: Record<string, unknown>): MinOrderAmount {
    this.validateShape(data, MinOrderAmountShape);

    return new MinOrderAmount({
      amount: data.amount as number,
      currency: data.currency as string,
    });
  }
}

export type MinQuantityProps = {
  quantity: number;
};

export class MinQuantity extends PromotionRuleType<MinQuantityProps> {
  readonly ruleType = 'MIN_QUANTITY';

  constructor(props: MinQuantityProps) {
    super(props);
  }
}

export type ProductInCartProps = {
  productIds: ProductId[];
};

export class ProductInCart extends PromotionRuleType<ProductInCartProps> {
  readonly ruleType = 'PRODUCT_IN_CART';

  constructor(props: ProductInCartProps) {
    super(props);
  }
}

export type CategoryInCartProps = {
  categoryIds: CategoryId[];
};

export class CategoryInCart extends PromotionRuleType<CategoryInCartProps> {
  readonly ruleType = 'CATEGORY_IN_CART';

  constructor(props: CategoryInCartProps) {
    super(props);
  }
}

export type BrandInCartProps = {
  brandIds: BrandId[];
};

export class BrandInCart extends PromotionRuleType<BrandInCartProps> {
  readonly ruleType = 'BRAND_IN_CART';

  constructor(props: BrandInCartProps) {
    super(props);
  }
}

export type FirstOrderProps = Record<string, never>;

export class FirstOrder extends PromotionRuleType<FirstOrderProps> {
  readonly ruleType = 'FIRST_ORDER';

  constructor(props: FirstOrderProps = {}) {
    super(props);
  }
}

export type PaymentProviderRuleProps = {
  paymentProviderIds: PaymentProviderId[];
};

export class PaymentProviderRule extends PromotionRuleType<PaymentProviderRuleProps> {
  readonly ruleType = 'PAYMENT_PROVIDER';

  constructor(props: PaymentProviderRuleProps) {
    super(props);
  }
}
