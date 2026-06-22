//----------------- after checkout ------------------
// sku: Stock Keeping Unit. It’s an internal code used to identify and track a specific product variant in inventory, like a shirt in one size and color.

import {
  AddressId,
  OrderId,
  OrderItemId,
  ProductVariantId,
  UserId,
} from 'src/modules/shared/domain/ids';
import { ValueOf } from 'src/modules/shared/types/value-of';

export const OrderStatus = {
  Pending: 'pending', // created, not yet confirmed
  Placed: 'placed', // confirmed / payment initiated
  Paid: 'paid', // payment succeeded
} as const;
export type OrderStatus = ValueOf<typeof OrderStatus>;
type OrderItemProps = {
  readonly id: OrderItemId;
  readonly orderId: OrderId;
  readonly productVariantId: ProductVariantId;
  readonly productTitle: string;
  readonly unitPrice: number;
  readonly quantity: number;
};

type OrderProps = {
  readonly id: OrderId;
  readonly userId: UserId;
  billingAddressId?: AddressId;
  shippingAddressId?: AddressId;
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
      t += citem.subtotal;
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
  get billingAddressId(): AddressId | undefined {
    return this.props.billingAddressId;
  }
  get shippingAddressId(): AddressId | undefined {
    return this.props.shippingAddressId;
  }
  toJSON() {
    return {
      order: {
        id: this.id,
        userId: this.userId,
        status: this.status,
        totalAmount: this.total,
        billingAddressId: this.billingAddressId,
        shippingAddressId: this.shippingAddressId,
        createdAt: this.createdAt,
      },
      items: [...this.props.items],
    };
  }
}

class OrderItem {
  constructor(private props: OrderItemProps) {}
  get subtotal(): number {
    return this.props.quantity * this.props.unitPrice;
  }
  toJSON() {
    return { ...this.props, subtotal: this.subtotal };
  }
}
