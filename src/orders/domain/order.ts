//----------------- after checkout ------------------
// sku: Stock Keeping Unit. It’s an internal code used to identify and track a specific product variant in inventory, like a shirt in one size and color.

import { ProductVariantId } from './product';
enum OrderStatus {
  Pending = 'pending',
  Placed = 'placed',
}
class OrderItem {
  constructor(
    private readonly id: string,
    private readonly variantId: ProductVariantId,
    private readonly productName: string,
    private readonly sku: string,
    private readonly unitPrice: number,
    private readonly quantity: number,
  ) {}
}

export class Order {
  private items: OrderItem[] = [];
  private status: OrderStatus = OrderStatus.Pending;

  constructor(
    private readonly id: string,
    private readonly userId: string,
  ) {}

  addItem(item: OrderItem) {
    if (this.status !== OrderStatus.Pending)
      throw new Error('Order already placed');
    this.items.push(item);
  }

  placeOrder() {
    if (this.items.length === 0) throw new Error('Order is empty');
    this.status = OrderStatus.Placed;
  }
}
