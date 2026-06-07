class Brand {
  constructor(
    private readonly id: string,
    private readonly name: string,
  ) {}
}

class Category {
  private parentCategoryId?: string;
  constructor(
    private id: string,
    private name: string,
  ) {}
  getParentCategoryId(): string | undefined {
    return this.parentCategoryId;
  }
  setParentCategory(id: string): void {
    this.parentCategoryId = id;
  }
}
export type ProductVariantId = string;
class Product {
  brandId?: string;

  constructor(
    private readonly id: string,
    private name: string,
    private categoryId: string,
    private detailsHtml: string, // it must be much like an html page that is well designed to present the product details.) { }
  ) {}
}

class ProductVariant {
  private description?: string;
  private info: Record<string, string> = {}; // represented as key:value (JSONB) for which it can be substituted on the `details` html template.
  constructor(
    private readonly id: ProductVariantId,
    private readonly productId: string,
    private readonly sku: string,
    private price: number,
    private quantity: number,
  ) {}
}
