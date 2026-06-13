//----------------- after checkout ------------------
// sku: Stock Keeping Unit. It’s an internal code used to identify and track a specific product variant in inventory, like a shirt in one size and color.

import { OrderId, ProductVariantId, UserId } from 'src/shared/domain/ids';

const OrderStatus = {
  Pending: 'pending', // created, not yet confirmed
  Placed: 'placed', // confirmed / payment initiated
  Paid: 'paid', // payment succeeded
} as const;
type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
type OrderItemProps = {
  readonly id: OrderId;
  readonly variantId: ProductVariantId;
  readonly productTitle: string;
  readonly unitPrice: number;
  readonly quantity: number;
};

type OrderProps = {
  readonly id: OrderId;
  readonly userId: UserId;
  createdAt: Date;
  status: OrderStatus;
  items: OrderItem[];
};
export class Order {
  private constructor(private props: OrderProps) {}
  static create(userId: string): Order {
    return new Order({
      id: OrderId.create(), // will create a default new one if not provided.
      userId: UserId.create(userId),
      status: OrderStatus.Pending,
      createdAt: new Date(),
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
  get id(): OrderId {
    return this.props.id;
  }
  get userId(): UserId {
    return this.props.userId;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  toJSON() {
    return {
      order: {
        id: this.id,
        userId: this.userId,
        status: this.status,
        totalPrice: this.total,
        createdAt: this.createdAt,
      },
      items: this.props.items.map((item) => item.toJSON()),
    };
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
