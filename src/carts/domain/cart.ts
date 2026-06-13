import { ProductVariantId, UserId } from 'src/shared/domain/ids';

type CartItemProps = {
  readonly id: string;
  readonly productVariantId: ProductVariantId;
  userId: UserId;
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

export class Cart {
  constructor(private items: CartItem[] = []) {}

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

  toJSON(): CartItemProps[] {
    return [...this.items].map((citem) => citem.toJSON());
  }
}
