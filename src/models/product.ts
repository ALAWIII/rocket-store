class Brand {
  id: string;
  name: string;
}

class Category {
  id: string;
  name: string;
  parentCategoryId?: string;
}

class Product {
  id: string;
  name: string;
  brandId?: string;
  categoryId: string;
  detailsHtml: string; // it must be much like an html page that is well designed to present the product details.
}

class ProductVariant {
  id: string;
  productId: string;
  description: string;
  info: Record<string, string>; // represented as key:value (JSONB) for which it can be substituted on the `details` html template.
  sku: string;
  price: number;
  quantity: number;
}
