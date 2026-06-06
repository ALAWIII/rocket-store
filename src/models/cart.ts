//------------------ before checkout ---------------
class CartItem {
  variantId: string;
  quantity: number;
}

class Cart {
  id: string;
  userId: string;
  items: CartItem[];
}
