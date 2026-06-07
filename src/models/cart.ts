import { v7 } from 'uuid';
import { ProductVariantId } from './product';

class CartItem {
  constructor(
    private readonly id: string,
    private readonly productVariantId: ProductVariantId,
    private quantity: number,
  ) {
    if (quantity < 1) throw new Error('Quantity must be at least 1');
  }

  increase(quantity = 1) {
    if (quantity < 1) throw new Error('Quantity must be positive');
    this.quantity += quantity;
  }

  decrease(quantity = 1) {
    if (quantity < 1) throw new Error('Quantity must be positive');
    if (this.quantity - quantity < 1)
      throw new Error('Quantity cannot be less than 1');
    this.quantity -= quantity;
  }

  getProductVariantId() {
    return this.productVariantId;
  }

  getQuantity() {
    return this.quantity;
  }
}

class Cart {
  private items = new Map<ProductVariantId, CartItem>();

  constructor(
    private readonly id: string,
    private readonly userId: string,
  ) {}

  addItem(productVariantId: ProductVariantId, quantity = 1) {
    const existing = this.items.get(productVariantId);

    if (existing) {
      existing.increase(quantity);
      return;
    }

    const item = new CartItem(v7(), productVariantId, quantity);
    this.items.set(productVariantId, item);
  }

  removeItem(productVariantId: ProductVariantId) {
    this.items.delete(productVariantId);
  }

  getItems() {
    return [...this.items.values()];
  }
}
