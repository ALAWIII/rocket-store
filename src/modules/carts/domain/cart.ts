import {
  CartId,
  CartItemId,
  ProductVariantId,
  UserId,
} from 'src/modules/shared/domain/ids';

type CartItemProps = {
  readonly id: CartItemId;
  readonly productVariantId: ProductVariantId;
  quantity: number;
};
export class CartItem {
  constructor(private props: CartItemProps) {
    if (props.quantity < 1) throw new Error('Quantity must be at least 1');
  }

  get productVariantId(): ProductVariantId {
    return this.props.productVariantId;
  }

  get quantity(): number {
    return this.props.quantity;
  }
  set quantity(quantity: number) {
    if (quantity < 1) throw new Error('Quantity must be at least 1');
    this.props.quantity = quantity;
  }
  toJSON(): CartItemProps {
    return { ...this.props };
  }
}
type CartProps = {
  id: CartId;
  userId: UserId;
  createdAt: Date;
};
export class Cart {
  private items: CartItem[] = [];
  constructor(private props: CartProps) {}

  addItem(itemProps: CartItemProps) {
    const existing = this.getItem(itemProps.productVariantId);

    if (existing) {
      existing.quantity = itemProps.quantity;
      return;
    }
    const item = new CartItem(itemProps);
    this.items.push(item);
  }
  getItem(productVariantId: ProductVariantId): CartItem | undefined {
    return this.items.find(
      (citem) => citem.productVariantId == productVariantId,
    );
  }

  toJSON() {
    return { ...this.props, items: [...this.items] };
  }
}
