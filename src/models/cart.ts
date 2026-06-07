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

  increase(quantity = 1): void {
    if (quantity < 1) throw new Error('Quantity must be positive');
    this.quantity += quantity;
  }

  decrease(quantity = 1): void {
    if (quantity < 1) throw new Error('Quantity must be positive');
    if (this.quantity - quantity < 1)
      throw new Error('Quantity cannot be less than 1');
    this.quantity -= quantity;
  }

  getProductVariantId(): string {
    return this.productVariantId;
  }

  getQuantity(): number {
    return this.quantity;
  }
}

export class Cart {
  private items = new Map<ProductVariantId, CartItem>();

  constructor(
    private readonly id: string,
    private readonly userId: string,
  ) {}
  getItem(productVariantId: ProductVariantId): CartItem | undefined {
    return this.items.get(productVariantId);
  }
  createItem(
    productVariantId: ProductVariantId,
    quantity: number = 1,
  ): CartItem {
    return new CartItem(v7(), productVariantId, quantity);
  }
  addItem(productVariantId: ProductVariantId, quantity = 1) {
    const existing = this.getItem(productVariantId);

    if (existing) {
      existing.increase(quantity);
      return;
    }
    const item = this.createItem(productVariantId);
    this.items.set(productVariantId, item);
  }

  removeItem(productVariantId: ProductVariantId) {
    this.items.delete(productVariantId);
  }

  getItems() {
    return [...this.items.values()];
  }
}
