import { v7 } from 'uuid';
import { BrandId } from './brand';
import { ProductId, ProductVariantId } from 'src/shared/domain/ids';

// temporary will be replaced by layer specific DTO.
type ProductVariantData = {
  price: number;
  quantity: number;
  info: Record<string, string>;
  description?: string;
};

export class ProductTitle {
  private constructor(private _title: string) {}
  static create(title: string): ProductTitle {
    const normalized = title.trim();
    if (normalized.length < 2 || normalized.length > 100)
      throw new Error(
        'Invalid product title length must be between 2 and 100 characters.',
      );
    return new ProductTitle(normalized);
  }
  get title(): string {
    return this._title;
  }
}

export class Product {
  private variants = new ProductVaraintList();
  constructor(
    private productData: {
      id: ProductId;
      title: ProductTitle;
      brandId?: BrandId;
    },
  ) {}

  get id(): ProductId {
    return this.productData.id;
  }
  createVariant(pvd: ProductVariantData) {
    const v = ProductVariant.create(pvd, this.productData.id);
    this.variants.add(v);
  }
  updateVariant(variantId: ProductVariantId, vi: ProductVariantData) {
    const v = this.variants.getById(variantId);
    v?.update(vi);
  }
  removeVariant(id: ProductVariantId) {
    this.variants.remove(id);
  }
  get title(): string {
    return this.productData.title.title;
  }

  get brandId(): BrandId | undefined {
    return this.productData.brandId;
  }

  set title(title: ProductTitle) {
    this.productData.title = title;
  }

  assignBrand(brandId: BrandId) {
    this.productData.brandId = brandId;
  }

  removeBrand(): void {
    this.productData.brandId = undefined;
  }
}
class ProductVaraintList {
  private variants = new Map<ProductVariantId, ProductVariant>();
  add(variant: ProductVariant): void {
    this.variants.set(variant.getId(), variant);
  }
  remove(variantId: ProductVariantId): ProductVariant | undefined {
    const v = this.getById(variantId);
    this.variants.delete(variantId);
    return v;
  }
  getById(variantId: ProductVariantId): ProductVariant | undefined {
    return this.variants.get(variantId);
  }
  getVariants(): ProductVariant[] {
    return [...this.variants.values()];
  }
}
class ProductVariant {
  constructor(
    private readonly id: ProductVariantId,
    private readonly productId: ProductId,
    private price: number,
    private quantity: number,
    private description?: string,
    private info: Record<string, string> = {},
  ) {
    if (price < 0) throw new Error('Price cannot be negative');
    if (quantity < 0) throw new Error('Quantity cannot be negative');
  }
  static create(v: ProductVariantData, productId: ProductId): ProductVariant {
    return new ProductVariant(
      v7(),
      productId,
      v.price,
      v.quantity,
      v.description,
      v.info,
    );
  }
  update(input: ProductVariantData) {
    this.description = input.description;
    this.info = input.info;
    this.price = input.price;
    this.quantity = input.quantity;
  }
  getId(): ProductVariantId {
    return this.id;
  }

  getProductId(): ProductId {
    return this.productId;
  }

  getPrice(): number {
    return this.price;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getInfo(): Record<string, string> {
    return { ...this.info };
  }
}
