//----------------- after checkout ------------------
// sku: Stock Keeping Unit. It’s an internal code used to identify and track a specific product variant in inventory, like a shirt in one size and color.
class OrderItem {
  variantId: string; // points to ProductVariant ID.
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

class Order {
  id: string;
  userId: string;
  items: OrderItem[];
}
