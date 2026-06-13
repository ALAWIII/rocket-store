//----------------- after checkout ------------------
// sku: Stock Keeping Unit. It’s an internal code used to identify and track a specific product variant in inventory, like a shirt in one size and color.

import { ProductVariantId } from 'src/shared/domain/ids';
import { v7 } from 'uuid';

enum OrderStatus {
  Pending = 'pending', // created, not yet confirmed
  Placed = 'placed', // confirmed / payment initiated
  Paid = 'paid', // payment succeeded
}
type OrderItemProps = {
  readonly id: string;
  readonly variantId: ProductVariantId;
  readonly productTitle: string;
  readonly unitPrice: number;
  readonly quantity: number;
};

type OrderProps = {
  readonly id: string;
  readonly userId: string;
  status: OrderStatus;
  items: OrderItem[];
};
export class Order {
  private constructor(private props: OrderProps) {}
  static create(userId: string): Order {
    return new Order({
      id: v7(),
      userId: userId,
      status: OrderStatus.Pending,
      items: [],
    });
  }
  static restore(props: OrderProps): Order {
    return new Order(props);
  }
  addItem(itemProps: OrderItemProps) {
    this.props.items.push(new OrderItem(itemProps));
  }

  placeOrder() {
    if (this.props.items.length === 0) throw new Error('Order is empty');
    this.props.status = OrderStatus.Placed;
  }
  get total(): number {
    let t = 0;
    for (const citem of this.props.items) {
      t += citem.total;
    }
    return t;
  }
}

class OrderItem {
  constructor(private props: OrderItemProps) {}
  get total(): number {
    return this.props.quantity * this.props.unitPrice;
  }
  toJSON(): OrderItemProps {
    return { ...this.props };
  }
}
